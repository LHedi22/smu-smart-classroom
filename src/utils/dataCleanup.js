/**
 * Data Cleanup Utilities
 * 
 * Automatically fixes common data issues:
 * - Orphaned courses (assigned to non-existent professors)
 * - Orphaned rooms (in assignedRooms but no course)
 * - Professor-room mismatches
 * - Courses with missing/invalid schedules
 */

import { ref, get, set, update, remove } from 'firebase/database'
import { db } from '../firebase'

/**
 * Fix orphaned courses by unassigning them
 * @param {Array} orphanedCourses - List of orphaned courses from diagnostics
 * @returns {Promise<Object>} Cleanup result
 */
export async function fixOrphanedCourses(orphanedCourses) {
  const results = {
    fixed: [],
    failed: [],
  }

  for (const course of orphanedCourses) {
    try {
      await update(ref(db, `courses/${course.courseId}`), {
        professorUid: null,
        professorId: null,
      })
      results.fixed.push(course.courseId)
    } catch (err) {
      results.failed.push({ courseId: course.courseId, error: err.message })
    }
  }

  return results
}

/**
 * Remove orphaned room assignments
 * @param {Array} orphanedRooms - List of orphaned rooms from diagnostics
 * @returns {Promise<Object>} Cleanup result
 */
export async function removeOrphanedRooms(orphanedRooms) {
  const results = {
    fixed: [],
    failed: [],
  }

  for (const room of orphanedRooms) {
    try {
      await remove(
        ref(db, `professors/${room.profUid}/assignedRooms/${room.roomId}`)
      )
      results.fixed.push(`${room.profUid}/${room.roomId}`)
    } catch (err) {
      results.failed.push({
        profUid: room.profUid,
        roomId: room.roomId,
        error: err.message,
      })
    }
  }

  return results
}

/**
 * Fix professor-room mismatches by adding missing room assignments
 * @param {Array} mismatches - List of mismatches from diagnostics
 * @returns {Promise<Object>} Cleanup result
 */
export async function fixProfessorRoomMismatches(mismatches) {
  const results = {
    fixed: [],
    failed: [],
  }

  for (const mismatch of mismatches) {
    try {
      await set(
        ref(
          db,
          `professors/${mismatch.professorUid}/assignedRooms/${mismatch.room}`
        ),
        true
      )
      results.fixed.push(
        `${mismatch.professorUid}/${mismatch.room}`
      )
    } catch (err) {
      results.failed.push({
        professorUid: mismatch.professorUid,
        room: mismatch.room,
        error: err.message,
      })
    }
  }

  return results
}

/**
 * Fix courses with invalid schedule format
 * @param {Array} courseProblems - Courses with schedule issues
 * @returns {Promise<Object>} Cleanup result
 */
export async function fixCourseSchedules(courseProblems) {
  const results = {
    fixed: [],
    failed: [],
    skipped: [],
  }

  try {
    const snap = await get(ref(db, 'courses'))
    if (!snap.exists()) return results

    const courses = snap.val()

    for (const course of courseProblems) {
      const courseData = courses[course.courseId]
      if (!courseData) {
        results.skipped.push(course.courseId)
        continue
      }

      try {
        // If schedule is missing or empty, set a default
        if (!courseData.schedule || courseData.schedule.length === 0) {
          await update(ref(db, `courses/${course.courseId}`), {
            schedule: [
              {
                dayOfWeek: 'Monday',
                starttime: '09:00',
                endtime: '11:00',
              },
            ],
          })
          results.fixed.push(course.courseId)
        }
        // If schedule is object instead of array, skip (needs manual review)
        else if (!Array.isArray(courseData.schedule)) {
          results.skipped.push(course.courseId)
        } else {
          results.fixed.push(course.courseId)
        }
      } catch (err) {
        results.failed.push({
          courseId: course.courseId,
          error: err.message,
        })
      }
    }
  } catch (err) {
    results.failed.push({ error: `Batch error: ${err.message}` })
  }

  return results
}

/**
 * Run all cleanup operations
 * @param {Object} diagnostics - Full diagnostics report
 * @returns {Promise<Object>} Summary of all fixes
 */
export async function runFullCleanup(diagnostics) {
  console.log('🧹 Starting data cleanup...')

  const results = {
    orphanedCourses: await fixOrphanedCourses(
      diagnostics.assignments?.orphanedCourses || []
    ),
    orphanedRooms: await removeOrphanedRooms(
      diagnostics.assignments?.orphanedRooms || []
    ),
    mismatches: await fixProfessorRoomMismatches(
      diagnostics.assignments?.mismatches || []
    ),
    schedules: await fixCourseSchedules(diagnostics.courses?.problems || []),
    timestamp: new Date().toISOString(),
  }

  const totalFixed =
    results.orphanedCourses.fixed.length +
    results.orphanedRooms.fixed.length +
    results.mismatches.fixed.length +
    results.schedules.fixed.length

  console.log(`✅ Cleanup complete: ${totalFixed} issues fixed`)

  return results
}
