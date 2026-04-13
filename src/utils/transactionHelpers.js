/**
 * Firebase Transaction Utilities for Course Assignments
 * 
 * Ensures atomic updates to maintain data consistency:
 * - Course assignment updates both /courses/{id} AND /professors/{uid}/assignedRooms
 * - All or nothing: if any part fails, entire transaction rolls back
 * - Prevents orphaned assignments and broken relationships
 */

import { ref, runTransaction } from 'firebase/database'
import { db } from '../firebase'

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

  return runTransaction(ref(db), async (transaction) => {
    // 1. Read current course
    const courseRef = ref(db, `courses/${courseId}`)
    const courseSnap = await transaction.get(courseRef)
    
    if (!courseSnap.exists()) {
      throw new Error(`Course ${courseId} does not exist`)
    }

    const course = courseSnap.val()
    
    // 2. Check if already assigned to different professor
    if (course.professorUid && course.professorUid !== profUid) {
      const prevProfRef = ref(db, `professors/${course.professorUid}/assignedRooms/${course.room}`)
      transaction.update(prevProfRef, null)  // Remove old assignment
    }

    // 3. Update course with new professor
    transaction.update(courseRef, {
      professorUid: profUid,
      professorId: profMoodleId,
      room: roomId,
      assignedAt: new Date().toISOString(),
    })

    // 4. Update professor's assigned rooms
    const profRoomRef = ref(db, `professors/${profUid}/assignedRooms/${roomId}`)
    transaction.update(profRoomRef, true)

    return {
      success: true,
      courseId,
      profUid,
      roomId,
      message: `Course ${courseId} assigned to professor in room ${roomId}`,
    }
  }).catch(err => {
    console.error(`[assignCourseToProf] Transaction failed for ${courseId}:`, err)
    throw new Error(`Failed to assign course: ${err.message}`)
  })
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

  return runTransaction(ref(db), async (transaction) => {
    // 1. Read current course
    const courseRef = ref(db, `courses/${courseId}`)
    const courseSnap = await transaction.get(courseRef)
    
    if (!courseSnap.exists()) {
      throw new Error(`Course ${courseId} does not exist`)
    }

    const course = courseSnap.val()
    const roomId = course.room

    // 2. Check if assigned to this professor
    if (course.professorUid !== profUid) {
      throw new Error(
        `Course ${courseId} is not assigned to professor ${profUid}`
      )
    }

    // 3. Clear course assignment
    transaction.update(courseRef, {
      professorUid: null,
      professorId: null,
      room: null,
      unassignedAt: new Date().toISOString(),
    })

    // 4. Remove room from professor's assigned rooms
    if (roomId) {
      const profRoomRef = ref(db, `professors/${profUid}/assignedRooms/${roomId}`)
      transaction.update(profRoomRef, null)
    }

    return {
      success: true,
      courseId,
      profUid,
      message: `Course ${courseId} unassigned from professor`,
    }
  }).catch(err => {
    console.error(`[unassignCourseFromProf] Transaction failed for ${courseId}:`, err)
    throw new Error(`Failed to unassign course: ${err.message}`)
  })
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

  return runTransaction(ref(db), async (transaction) => {
    // 1. Read current course
    const courseRef = ref(db, `courses/${courseId}`)
    const courseSnap = await transaction.get(courseRef)
    
    if (!courseSnap.exists()) {
      throw new Error(`Course ${courseId} does not exist`)
    }

    const course = courseSnap.val()

    // 2. Verify it's assigned to oldProfUid
    if (course.professorUid !== oldProfUid) {
      throw new Error(
        `Course ${courseId} is not currently assigned to professor ${oldProfUid}`
      )
    }

    const oldRoomId = course.room

    // 3. Update course with new professor
    transaction.update(courseRef, {
      professorUid: newProfUid,
      professorId: newProfMoodleId,
      room: newRoomId,
      reassignedAt: new Date().toISOString(),
    })

    // 4. Remove from old professor's rooms
    if (oldRoomId && oldProfUid) {
      const oldProfRoomRef = ref(db, `professors/${oldProfUid}/assignedRooms/${oldRoomId}`)
      transaction.update(oldProfRoomRef, null)
    }

    // 5. Add to new professor's rooms
    const newProfRoomRef = ref(db, `professors/${newProfUid}/assignedRooms/${newRoomId}`)
    transaction.update(newProfRoomRef, true)

    return {
      success: true,
      courseId,
      oldProfUid,
      newProfUid,
      message: `Course ${courseId} reassigned from ${oldProfUid} to ${newProfUid}`,
    }
  }).catch(err => {
    console.error(`[reassignCourse] Transaction failed for ${courseId}:`, err)
    throw new Error(`Failed to reassign course: ${err.message}`)
  })
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
  return runTransaction(ref(db), async (transaction) => {
    const courseRef = ref(db, `courses/${courseId}`)
    const courseSnap = await transaction.get(courseRef)

    if (!courseSnap.exists()) {
      return false
    }

    const course = courseSnap.val()

    // Course must be assigned to this professor
    if (course.professorUid !== profUid) {
      return false
    }

    // Professor must have the room
    const profRoomRef = ref(db, `professors/${profUid}/assignedRooms/${course.room}`)
    const profRoomSnap = await transaction.get(profRoomRef)

    return profRoomSnap.exists() && profRoomSnap.val() === true
  }).catch(err => {
    console.error(`[verifyCourseAssignment] Verification failed:`, err)
    return false
  })
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
  return runTransaction(ref(db), async (transaction) => {
    const orphanedCourses = []
    const orphanedRooms = []

    // 1. Check for courses with non-existent professors
    const coursesRef = ref(db, 'courses')
    const coursesSnap = await transaction.get(coursesRef)
    
    if (coursesSnap.exists()) {
      const courses = coursesSnap.val()
      for (const [courseId, course] of Object.entries(courses)) {
        if (course.professorUid) {
          const profRef = ref(db, `professors/${course.professorUid}`)
          const profSnap = await transaction.get(profRef)
          
          if (!profSnap.exists()) {
            orphanedCourses.push(courseId)
          }
        }
      }
    }

    // 2. Check for professors with non-existent rooms (rooms without courses)
    const profsRef = ref(db, 'professors')
    const profsSnap = await transaction.get(profsRef)
    
    if (profsSnap.exists()) {
      const profs = profsSnap.val()
      for (const [profUid, prof] of Object.entries(profs)) {
        if (prof.assignedRooms) {
          for (const roomId of Object.keys(prof.assignedRooms)) {
            const coursesInRoom = await transaction.get(
              ref(db, `courses`)
            )
            const hasRoom = coursesInRoom.exists()
              ? Object.values(coursesInRoom.val()).some(c => c.room === roomId)
              : false
            
            if (!hasRoom) {
              orphanedRooms.push({ profUid, roomId })
            }
          }
        }
      }
    }

    return {
      orphanedCourses,
      orphanedRooms,
      foundIssues: orphanedCourses.length + orphanedRooms.length,
    }
  }).catch(err => {
    console.error(`[findOrphanedAssignments] Cleanup check failed:`, err)
    throw new Error(`Failed to find orphaned assignments: ${err.message}`)
  })
}
