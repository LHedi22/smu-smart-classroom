/**
 * Admin Diagnostics Module
 * 
 * Comprehensive health checks for the SMU Classroom Dashboard
 * Identifies data inconsistencies, orphaned records, and system issues
 */

import { ref, get, query, orderByChild, equalTo } from 'firebase/database'
import { db } from '../firebase'

/**
 * Check overall system health
 * @returns {Promise<Object>} Health status
 */
export async function getSystemHealth() {
  const checks = {
    timestamp: new Date().toISOString(),
    database: await checkDatabaseConnection(),
    data: await checkDataIntegrity(),
    professors: await checkProfessors(),
    courses: await checkCourses(),
    assignments: await checkAssignments(),
    sessions: await checkSessions(),
  }

  const totalIssues = Object.values(checks).reduce((sum, check) => {
    return sum + (check.issues?.length || 0)
  }, 0)

  return {
    ...checks,
    status: totalIssues === 0 ? 'healthy' : 'unhealthy',
    issueCount: totalIssues,
  }
}

/**
 * Check database connectivity
 */
async function checkDatabaseConnection() {
  try {
    // Try to read a path that should always be readable if connected
    const snap = await get(ref(db, 'courses'))
    // If we can get here without exception, we're connected
    return {
      connected: true,
      issues: [],
    }
  } catch (err) {
    // Permission denied is still a connection (just auth issue)
    if (err.code === 'PERMISSION_DENIED') {
      return {
        connected: true,
        issues: ['Database connected but permission denied. Check rules.'],
      }
    }
    return {
      connected: false,
      issues: [`Connection error: ${err.message}`],
    }
  }
}

/**
 * Check data structure consistency
 */
async function checkDataIntegrity() {
  const issues = []

  try {
    const snap = await get(ref(db, '/'))
    if (!snap.exists()) {
      issues.push('Database empty')
      return { issues, recordCount: 0 }
    }

    const data = snap.val()
    const collections = Object.keys(data)

    // Warn if critical collections missing
    if (!data.professors) issues.push('Missing professors collection')
    if (!data.courses) issues.push('Missing courses collection')
    if (!data.classrooms) issues.push('Missing classrooms collection')

    return {
      issues,
      recordCount: collections.length,
      collections,
    }
  } catch (err) {
    issues.push(`Integrity check error: ${err.message}`)
    return { issues, recordCount: 0 }
  }
}

/**
 * Check professor data quality
 */
export async function checkProfessors() {
  const issues = []
  let count = 0
  const problems = []

  try {
    const snap = await get(ref(db, 'professors'))
    if (!snap.exists()) {
      issues.push('No professors found')
      return { count: 0, issues, problems }
    }

    const profs = snap.val()
    count = Object.keys(profs).length

    for (const [uid, prof] of Object.entries(profs)) {
      const profProblems = []

      // Check required fields
      if (!prof.name) profProblems.push('missing name')
      if (!prof.email) profProblems.push('missing email')
      if (prof.moodleUserId === null || prof.moodleUserId === undefined) {
        profProblems.push('missing moodleUserId')
      }

      // Check assignedRooms structure
      if (prof.assignedRooms && typeof prof.assignedRooms !== 'object') {
        profProblems.push('assignedRooms not an object')
      }

      if (profProblems.length > 0) {
        problems.push({
          uid,
          name: prof.name || '(unnamed)',
          issues: profProblems,
        })
      }
    }

    if (problems.length > 0) {
      issues.push(`${problems.length} professors with issues`)
    }

    return { count, issues, problems }
  } catch (err) {
    issues.push(`Professor check error: ${err.message}`)
    return { count, issues, problems }
  }
}

/**
 * Check course data quality
 */
export async function checkCourses() {
  const issues = []
  let count = 0
  const problems = []

  try {
    const snap = await get(ref(db, 'courses'))
    if (!snap.exists()) {
      issues.push('No courses found')
      return { count: 0, issues, problems }
    }

    const courses = snap.val()
    count = Object.keys(courses).length

    for (const [courseId, course] of Object.entries(courses)) {
      const courseProblems = []

      // Check required fields
      if (!course.code) courseProblems.push('missing code')
      if (!course.name) courseProblems.push('missing name')

      // Check schedule format (should be array)
      if (course.schedule) {
        if (!Array.isArray(course.schedule)) {
          courseProblems.push('schedule not array format')
        } else if (course.schedule.length === 0) {
          courseProblems.push('empty schedule')
        }
      } else {
        courseProblems.push('missing schedule')
      }

      // Check assignment
      if (!course.professorId && !course.professorUid) {
        courseProblems.push('not assigned to any professor')
      }

      if (courseProblems.length > 0) {
        problems.push({
          courseId,
          code: course.code || '(unknown)',
          issues: courseProblems,
        })
      }
    }

    if (problems.length > 0) {
      issues.push(`${problems.length} courses with issues`)
    }

    return { count, issues, problems }
  } catch (err) {
    issues.push(`Course check error: ${err.message}`)
    return { count, issues, problems }
  }
}

/**
 * Check course-professor assignments consistency
 */
export async function checkAssignments() {
  const issues = []
  const orphanedCourses = []
  const orphanedRooms = []
  const mismatches = []

  try {
    const [coursesSnap, profsSnap] = await Promise.all([
      get(ref(db, 'courses')),
      get(ref(db, 'professors')),
    ])

    if (!coursesSnap.exists() || !profsSnap.exists()) {
      issues.push('Missing courses or professors collection')
      return { issues, orphanedCourses, orphanedRooms, mismatches }
    }

    const courses = coursesSnap.val()
    const profs = profsSnap.val()

    // Check for orphaned courses (assigned to non-existent professor)
    for (const [courseId, course] of Object.entries(courses)) {
      if (course.professorUid && !profs[course.professorUid]) {
        orphanedCourses.push({
          courseId,
          professorUid: course.professorUid,
          reason: 'assigned to non-existent professor',
        })
      }

      // Check if professor has the room in assignedRooms
      if (course.professorUid && course.room) {
        const prof = profs[course.professorUid]
        if (!prof?.assignedRooms?.[course.room]) {
          mismatches.push({
            courseId,
            professorUid: course.professorUid,
            room: course.room,
            issue: 'professor missing room in assignedRooms',
          })
        }
      }
    }

    // Check for orphaned rooms (professor has room but no course)
    for (const [profUid, prof] of Object.entries(profs)) {
      if (prof.assignedRooms) {
        for (const roomId of Object.keys(prof.assignedRooms)) {
          const hasRoom = Object.values(courses).some(
            c => c.room === roomId && c.professorUid === profUid
          )

          if (!hasRoom) {
            orphanedRooms.push({
              profUid,
              roomId,
              reason: 'room in assignedRooms but no course',
            })
          }
        }
      }
    }

    if (orphanedCourses.length > 0) {
      issues.push(`${orphanedCourses.length} orphaned courses`)
    }
    if (orphanedRooms.length > 0) {
      issues.push(`${orphanedRooms.length} orphaned rooms`)
    }
    if (mismatches.length > 0) {
      issues.push(`${mismatches.length} professor-room mismatches`)
    }

    return {
      issues,
      orphanedCourses,
      orphanedRooms,
      mismatches,
      consistencyScore: calculateConsistency(
        orphanedCourses,
        orphanedRooms,
        mismatches,
        Object.keys(courses).length
      ),
    }
  } catch (err) {
    issues.push(`Assignment check error: ${err.message}`)
    return { issues, orphanedCourses, orphanedRooms, mismatches }
  }
}

/**
 * Check session data quality
 */
export async function checkSessions() {
  const issues = []
  let count = 0
  const problems = []
  const statusBreakdown = { pending: 0, in_progress: 0, done: 0, blocked: 0 }

  try {
    const snap = await get(ref(db, 'sessions'))
    if (!snap.exists()) {
      issues.push('No sessions found (may be expected if using on-demand generation)')
      return { count: 0, issues, problems, statusBreakdown }
    }

    const sessions = snap.val()
    count = Object.keys(sessions).length

    for (const [sessionId, session] of Object.entries(sessions)) {
      const sessionProblems = []

      // Check required fields
      if (!session.courseId) sessionProblems.push('missing courseId')
      if (!session.roomId) sessionProblems.push('missing roomId')
      if (!session.date) sessionProblems.push('missing date')
      if (!session.startTime) sessionProblems.push('missing startTime')

      // Check UID format (should have professorId, not professorUid)
      if (!session.professorId) {
        sessionProblems.push('missing professorId (should be moodleUserId)')
      }
      if (session.professorUid) {
        sessionProblems.push('has old professorUid field (should be professorId)')
      }

      if (sessionProblems.length > 0) {
        problems.push({
          sessionId,
          courseId: session.courseId || '(unknown)',
          issues: sessionProblems,
        })
      }
    }

    if (problems.length > 0) {
      issues.push(`${problems.length} sessions with issues`)
    }

    return { count, issues, problems, statusBreakdown }
  } catch (err) {
    issues.push(`Session check error: ${err.message}`)
    return { count, issues, problems, statusBreakdown }
  }
}

/**
 * Calculate consistency score (0-100)
 */
function calculateConsistency(orphanedCourses, orphanedRooms, mismatches, totalCourses) {
  if (totalCourses === 0) return 100
  const issues = orphanedCourses.length + orphanedRooms.length + mismatches.length
  return Math.max(0, 100 - (issues / totalCourses) * 100)
}

/**
 * Get comprehensive system report
 */
export async function getFullReport() {
  const health = await getSystemHealth()

  return {
    generatedAt: new Date().toISOString(),
    ...health,
    recommendations: generateRecommendations(health),
  }
}

/**
 * Generate actionable recommendations based on issues
 */
function generateRecommendations(health) {
  const recommendations = []

  if (health.data.issues.length > 0) {
    recommendations.push({
      severity: 'critical',
      area: 'Database',
      message: 'Database structure issues detected',
      action: 'Check Firebase database schema',
    })
  }

  if ((health.professors.problems?.length || 0) > 0) {
    recommendations.push({
      severity: 'high',
      area: 'Professors',
      message: `${health.professors.problems.length} professors have missing required fields`,
      action: 'Run data migration to fill missing moodleUserIds',
    })
  }

  if ((health.courses.problems?.length || 0) > 0) {
    recommendations.push({
      severity: 'high',
      area: 'Courses',
      message: `${health.courses.problems.length} courses have data issues`,
      action: 'Check course schedules and assignments',
    })
  }

  if ((health.assignments.orphanedCourses?.length || 0) > 0) {
    recommendations.push({
      severity: 'high',
      area: 'Assignments',
      message: `${health.assignments.orphanedCourses.length} orphaned courses detected`,
      action: 'Use transaction cleanup to remove orphaned assignments',
    })
  }

  if ((health.assignments.orphanedRooms?.length || 0) > 0) {
    recommendations.push({
      severity: 'medium',
      area: 'Assignments',
      message: `${health.assignments.orphanedRooms.length} orphaned room assignments found`,
      action: 'Remove unused rooms from professor assignments',
    })
  }

  if ((health.assignments.mismatches?.length || 0) > 0) {
    recommendations.push({
      severity: 'medium',
      area: 'Consistency',
      message: `${health.assignments.mismatches.length} professor-room mismatches`,
      action: 'Run transaction-based reassignments to fix mismatches',
    })
  }

  return recommendations.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}
