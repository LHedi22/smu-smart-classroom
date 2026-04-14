/**
 * Firebase Atomic Update Utilities for Course Assignments
 *
 * Uses Firebase RTDB multi-path update() for atomic fan-out writes.
 * A single update() call with a flat paths object is guaranteed atomic by Firebase —
 * all paths succeed or none do. This replaces the previous runTransaction pattern,
 * which used Firestore-style transaction syntax incompatible with RTDB.
 */

import { ref, get, update } from 'firebase/database'
import { db } from '../firebase'

/**
 * Atomically assign a course to a professor.
 *
 * Updates both:
 * - /courses/{courseId} → professorUid, professorId, room
 * - /professors/{profUid}/assignedRooms → {roomId: true}
 * Removes the previous professor's room assignment if course was reassigned.
 *
 * @param {string} courseId      - Course code (e.g. "CS102")
 * @param {string} profUid       - Firebase UID of professor
 * @param {number} profMoodleId  - Moodle ID of professor
 * @param {string} roomId        - Room code (e.g. "A101")
 */
export async function assignCourseToProf(courseId, profUid, profMoodleId, roomId) {
  if (!courseId || !profUid || !profMoodleId || !roomId) {
    throw new Error('Missing required parameters for course assignment')
  }

  const courseSnap = await get(ref(db, `courses/${courseId}`))
  if (!courseSnap.exists()) throw new Error(`Course ${courseId} does not exist`)

  const course = courseSnap.val()
  const updates = {}

  // Remove old professor's room assignment if switching professors
  if (course.professorUid && course.professorUid !== profUid && course.room) {
    updates[`professors/${course.professorUid}/assignedRooms/${course.room}`] = null
  }

  updates[`courses/${courseId}/professorUid`]                    = profUid
  updates[`courses/${courseId}/professorId`]                     = profMoodleId
  updates[`courses/${courseId}/room`]                            = roomId
  updates[`courses/${courseId}/assignedAt`]                      = new Date().toISOString()
  updates[`professors/${profUid}/assignedRooms/${roomId}`]        = true

  await update(ref(db), updates)
  return { success: true, courseId, profUid, roomId, message: `Course ${courseId} assigned to professor in room ${roomId}` }
}

/**
 * Atomically unassign a course from a professor.
 *
 * Updates both:
 * - /courses/{courseId} → clear professorUid, professorId, room
 * - /professors/{profUid}/assignedRooms → remove roomId
 *
 * @param {string} courseId - Course code
 * @param {string} profUid  - Firebase UID of professor
 */
export async function unassignCourseFromProf(courseId, profUid) {
  if (!courseId || !profUid) {
    throw new Error('Missing courseId or profUid for unassignment')
  }

  const courseSnap = await get(ref(db, `courses/${courseId}`))
  if (!courseSnap.exists()) throw new Error(`Course ${courseId} does not exist`)

  const course = courseSnap.val()
  if (course.professorUid !== profUid) {
    throw new Error(`Course ${courseId} is not assigned to professor ${profUid}`)
  }

  const updates = {}
  updates[`courses/${courseId}/professorUid`]  = null
  updates[`courses/${courseId}/professorId`]   = null
  updates[`courses/${courseId}/room`]          = null
  updates[`courses/${courseId}/unassignedAt`]  = new Date().toISOString()
  if (course.room) {
    updates[`professors/${profUid}/assignedRooms/${course.room}`] = null
  }

  await update(ref(db), updates)
  return { success: true, courseId, profUid, message: `Course ${courseId} unassigned from professor` }
}

/**
 * Atomically reassign a course from one professor to another.
 *
 * @param {string} courseId        - Course code
 * @param {string} oldProfUid      - Firebase UID of current professor
 * @param {string} newProfUid      - Firebase UID of new professor
 * @param {number} newProfMoodleId - Moodle ID of new professor
 * @param {string} newRoomId       - New room code
 */
export async function reassignCourse(courseId, oldProfUid, newProfUid, newProfMoodleId, newRoomId) {
  if (!courseId || !oldProfUid || !newProfUid || !newProfMoodleId || !newRoomId) {
    throw new Error('Missing required parameters for course reassignment')
  }

  const courseSnap = await get(ref(db, `courses/${courseId}`))
  if (!courseSnap.exists()) throw new Error(`Course ${courseId} does not exist`)

  const course = courseSnap.val()
  if (course.professorUid !== oldProfUid) {
    throw new Error(`Course ${courseId} is not currently assigned to professor ${oldProfUid}`)
  }

  const updates = {}

  // Remove old professor's room
  if (course.room) {
    updates[`professors/${oldProfUid}/assignedRooms/${course.room}`] = null
  }

  updates[`courses/${courseId}/professorUid`]                       = newProfUid
  updates[`courses/${courseId}/professorId`]                        = newProfMoodleId
  updates[`courses/${courseId}/room`]                               = newRoomId
  updates[`courses/${courseId}/reassignedAt`]                       = new Date().toISOString()
  updates[`professors/${newProfUid}/assignedRooms/${newRoomId}`]     = true

  await update(ref(db), updates)
  return {
    success: true,
    courseId,
    oldProfUid,
    newProfUid,
    message: `Course ${courseId} reassigned from ${oldProfUid} to ${newProfUid}`,
  }
}

/**
 * Verify that a course-professor relationship is consistent.
 *
 * @param {string} courseId - Course code
 * @param {string} profUid  - Professor Firebase UID
 * @returns {Promise<boolean>} True if consistent
 */
export async function verifyCourseAssignment(courseId, profUid) {
  try {
    const courseSnap = await get(ref(db, `courses/${courseId}`))
    if (!courseSnap.exists()) return false

    const course = courseSnap.val()
    if (course.professorUid !== profUid) return false

    const roomSnap = await get(ref(db, `professors/${profUid}/assignedRooms/${course.room}`))
    return roomSnap.exists() && roomSnap.val() === true
  } catch {
    return false
  }
}
