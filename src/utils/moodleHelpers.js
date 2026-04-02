/**
 * Map a Moodle course object to the shape used by the dashboard.
 * Moodle returns many fields we don't need — this keeps payloads lean.
 */
export function parseCourse(raw) {
  return {
    id:        String(raw.id),
    shortname: raw.shortname,
    fullname:  raw.fullname,
    // startDate / endDate come back as Unix timestamps
    startDate: raw.startdate ? new Date(raw.startdate * 1000).toISOString() : null,
    endDate:   raw.enddate   ? new Date(raw.enddate   * 1000).toISOString() : null,
  }
}

/**
 * Map a Moodle enrolled-user object to minimal student shape.
 */
export function parseStudent(raw) {
  return {
    id:              String(raw.id),
    fullname:        raw.fullname,
    email:           raw.email ?? '',
    profileImageUrl: raw.profileimageurl ?? null,
  }
}

/**
 * Build the payload the Flask /api/moodle/attendance/sync endpoint expects.
 */
export function buildSyncPayload(courseId, sessionId, students) {
  return {
    courseId,
    sessionId,
    records: students.map(s => ({
      studentId: s.id,
      present:   s.present,
      note:      s.overrideNote ?? '',
    })),
  }
}
