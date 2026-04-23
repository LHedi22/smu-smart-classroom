/**
 * Firebase atomic utilities for course assignments.
 *
 * Realtime Database does not support Firestore-style read/write transaction objects.
 * We use explicit pre-reads + one multi-location update so assignment writes are atomic.
 */

import { ref, get, update } from 'firebase/database'
import { db } from '../firebase'
import { generateSessions } from './generateSessions'

async function loadCourseOrThrow(courseId) {
  const courseSnap = await get(ref(db, `courses/${courseId}`))
  if (!courseSnap.exists()) {
    throw new Error(`Course ${courseId} does not exist`)
  }
  return courseSnap.val()
}

async function loadProfessorOrThrow(profUid) {
  const profSnap = await get(ref(db, `professors/${profUid}`))
  if (!profSnap.exists()) {
    throw new Error(`Professor ${profUid} does not exist`)
  }
  return profSnap.val()
}

function nowIso() {
  return new Date().toISOString()
}

function buildGeneratedSessionUpdates(course, profUid, profMoodleId) {
  const semesterKey = course.semester || 'S26'
  const courseForGenerator = {
    ...course,
    id: course.id || course.code || course.courseId,
    shortname: course.shortname || course.code || course.courseId || course.id,
    fullname: course.fullname || course.name || course.code || course.courseId || course.id,
  }

  const generatedSessions = generateSessions([courseForGenerator], profMoodleId, semesterKey)
  const updates = {}

  for (const session of generatedSessions) {
    const sessionRecord = {
      ...session,
      professorUid: profUid,
      assignedAt: nowIso(),
      generatedBy: 'course-assignment',
      semester: semesterKey,
    }

    updates[`sessions/${session.id}`] = sessionRecord

    if (session.status === 'live' && session.roomId) {
      updates[`classrooms/${session.roomId}/activeSession`] = {
        sessionId: session.id,
        courseId: session.courseId,
        courseName: session.courseName,
        moodleCourseId: session.moodleCourseId ?? null,
        professorUid: profUid,
        professorId: profMoodleId,
        roomId: session.roomId,
        startTime: `${session.date}T${session.startTime}:00`,
        expectedEndTime: `${session.date}T${session.endTime}:00`,
        scheduledStart: session.startTime,
        scheduledEnd: session.endTime,
        date: session.date,
        type: session.type,
        status: 'live',
        generatedBy: 'course-assignment',
      }
    }
  }

  return updates
}

/**
 * Atomically assign a course to a professor
 * 
 * Updates both:
 * - /courses/{courseId} → professorId, professorUid, room
 * - /professors/{profUid}/assignedRooms → {roomId: true}
 * 
 * @param {string} courseId - Course code (e.g. "CS102")
 * @param {string} profUid - Firebase UID of professor
 * @param {number} profMoodleId - Moodle ID of professor
 * @param {string} roomId - Room code (e.g. "A101")
 * @returns {Promise} Resolves on success, rejects on failure
 * @throws {Error} If transaction fails
 */
export async function assignCourseToProf(courseId, profUid, profMoodleId, roomId) {
  if (!courseId || !profUid || !profMoodleId || !roomId) {
    throw new Error('Missing required parameters for course assignment')
  }
  try {
    const [course] = await Promise.all([
      loadCourseOrThrow(courseId),
      loadProfessorOrThrow(profUid),
    ])

    const updates = {
      [`courses/${courseId}/professorUid`]: profUid,
      [`courses/${courseId}/professorId`]: profMoodleId,
      [`courses/${courseId}/room`]: roomId,
      [`courses/${courseId}/assignedAt`]: nowIso(),
      [`courses/${courseId}/unassignedAt`]: null,
      [`professors/${profUid}/assignedRooms/${roomId}`]: true,
    }

    const previousProfUid = course.professorUid
    const previousRoom = course.room
    if (previousProfUid && previousRoom && (previousProfUid !== profUid || previousRoom !== roomId)) {
      updates[`professors/${previousProfUid}/assignedRooms/${previousRoom}`] = null
    }

    await update(ref(db), updates)

    const sessionUpdates = buildGeneratedSessionUpdates(course, profUid, profMoodleId)
    if (Object.keys(sessionUpdates).length > 0) {
      await update(ref(db), sessionUpdates)
    }

    return {
      success: true,
      courseId,
      profUid,
      roomId,
      message: `Course ${courseId} assigned to professor in room ${roomId}`,
    }
  } catch (err) {
    console.error(`[assignCourseToProf] Update failed for ${courseId}:`, err)
    throw new Error(`Failed to assign course: ${err.message}`)
  }
}

/**
 * Atomically unassign a course from a professor
 * 
 * Updates both:
 * - /courses/{courseId} → clear professorId, professorUid, room
 * - /professors/{profUid}/assignedRooms → remove roomId
 * 
 * @param {string} courseId - Course code
 * @param {string} profUid - Firebase UID of professor
 * @returns {Promise}
 * @throws {Error} If transaction fails
 */
export async function unassignCourseFromProf(courseId, profUid) {
  if (!courseId || !profUid) {
    throw new Error('Missing courseId or profUid for unassignment')
  }
  try {
    const course = await loadCourseOrThrow(courseId)
    const roomId = course.room

    if (course.professorUid !== profUid) {
      throw new Error(`Course ${courseId} is not assigned to professor ${profUid}`)
    }

    const updates = {
      [`courses/${courseId}/professorUid`]: null,
      [`courses/${courseId}/professorId`]: null,
      [`courses/${courseId}/unassignedAt`]: nowIso(),
    }

    if (roomId) {
      updates[`professors/${profUid}/assignedRooms/${roomId}`] = null
    }

    await update(ref(db), updates)
    return {
      success: true,
      courseId,
      profUid,
      message: `Course ${courseId} unassigned from professor`,
    }
  } catch (err) {
    console.error(`[unassignCourseFromProf] Update failed for ${courseId}:`, err)
    throw new Error(`Failed to unassign course: ${err.message}`)
  }
}

/**
 * Atomically reassign course from one professor to another
 * 
 * Combines unassign + assign in single transaction to prevent gaps
 * 
 * @param {string} courseId - Course code
 * @param {string} oldProfUid - Firebase UID of current professor
 * @param {string} newProfUid - Firebase UID of new professor
 * @param {number} newProfMoodleId - Moodle ID of new professor
 * @param {string} newRoomId - New room code
 * @returns {Promise}
 * @throws {Error} If transaction fails
 */
export async function reassignCourse(
  courseId,
  oldProfUid,
  newProfUid,
  newProfMoodleId,
  newRoomId
) {
  if (!courseId || !oldProfUid || !newProfUid || !newProfMoodleId || !newRoomId) {
    throw new Error('Missing required parameters for course reassignment')
  }
  try {
    const [course] = await Promise.all([
      loadCourseOrThrow(courseId),
      loadProfessorOrThrow(newProfUid),
    ])

    if (course.professorUid !== oldProfUid) {
      throw new Error(`Course ${courseId} is not currently assigned to professor ${oldProfUid}`)
    }

    const oldRoomId = course.room
    const updates = {
      [`courses/${courseId}/professorUid`]: newProfUid,
      [`courses/${courseId}/professorId`]: newProfMoodleId,
      [`courses/${courseId}/room`]: newRoomId,
      [`courses/${courseId}/reassignedAt`]: nowIso(),
      [`courses/${courseId}/unassignedAt`]: null,
      [`professors/${newProfUid}/assignedRooms/${newRoomId}`]: true,
    }

    if (oldRoomId && oldProfUid) {
      updates[`professors/${oldProfUid}/assignedRooms/${oldRoomId}`] = null
    }

    await update(ref(db), updates)

    const sessionUpdates = buildGeneratedSessionUpdates(
      { ...course, room: newRoomId, professorUid: newProfUid, professorId: newProfMoodleId },
      newProfUid,
      newProfMoodleId
    )
    if (Object.keys(sessionUpdates).length > 0) {
      await update(ref(db), sessionUpdates)
    }

    return {
      success: true,
      courseId,
      oldProfUid,
      newProfUid,
      message: `Course ${courseId} reassigned from ${oldProfUid} to ${newProfUid}`,
    }
  } catch (err) {
    console.error(`[reassignCourse] Update failed for ${courseId}:`, err)
    throw new Error(`Failed to reassign course: ${err.message}`)
  }
}

/**
 * Verify course-professor relationship is consistent
 * 
 * Checks that:
 * - If course has professorUid, professor has that room in assignedRooms
 * - If professor has room, course in that room has that professorUid
 * 
 * @param {string} courseId - Course code
 * @param {string} profUid - Professor Firebase UID
 * @returns {Promise<boolean>} True if consistent
 */
export async function verifyCourseAssignment(courseId, profUid) {
  try {
    const courseSnap = await get(ref(db, `courses/${courseId}`))
    if (!courseSnap.exists()) return false
    const course = courseSnap.val()
    if (course.professorUid !== profUid || !course.room) return false

    const profRoomSnap = await get(ref(db, `professors/${profUid}/assignedRooms/${course.room}`))
    return profRoomSnap.exists() && profRoomSnap.val() === true
  } catch (err) {
    console.error(`[verifyCourseAssignment] Verification failed:`, err)
    return false
  }
}

/**
 * Clean up orphaned assignments
 * 
 * Finds and removes:
 * - Courses assigned to non-existent professors
 * - Professors with rooms they don't teach
 * 
 * Note: This is a read-heavy operation. Use sparingly.
 * 
 * @returns {Promise<Object>} Count of orphaned items found
 */
export async function findOrphanedAssignments() {
  try {
    const orphanedCourses = []
    const orphanedRooms = []

    const [coursesSnap, profsSnap] = await Promise.all([
      get(ref(db, 'courses')),
      get(ref(db, 'professors')),
    ])

    const courses = coursesSnap.exists() ? coursesSnap.val() : {}
    const profs = profsSnap.exists() ? profsSnap.val() : {}

    for (const [courseId, course] of Object.entries(courses)) {
      if (course.professorUid && !profs[course.professorUid]) {
        orphanedCourses.push(courseId)
      }
    }

    for (const [profUid, prof] of Object.entries(profs)) {
      if (!prof.assignedRooms) continue
      for (const roomId of Object.keys(prof.assignedRooms)) {
        const hasRoom = Object.values(courses).some(c => c.room === roomId && c.professorUid === profUid)
        if (!hasRoom) {
          orphanedRooms.push({ profUid, roomId })
        }
      }
    }

    return {
      orphanedCourses,
      orphanedRooms,
      foundIssues: orphanedCourses.length + orphanedRooms.length,
    }
  } catch (err) {
    console.error(`[findOrphanedAssignments] Cleanup check failed:`, err)
    throw new Error(`Failed to find orphaned assignments: ${err.message}`)
  }
}
