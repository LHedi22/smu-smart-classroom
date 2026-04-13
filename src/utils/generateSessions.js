// src/utils/generateSessions.js
// Pure utility: Flask courses array → concrete session instances

import { normalizeSchedule } from './scheduleHelpers'

const SEMESTER_RANGES = {
  S26: { start: '2026-02-01', end: '2026-06-15' },
  F25: { start: '2025-09-15', end: '2026-01-25' },
}

const DAY_NUM = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 }

function toDateStr(d) {
  // Returns YYYY-MM-DD in local time (avoids UTC offset shifting the date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function computeStatus(dateStr, startTime, endTime) {
  const now = new Date()
  const today = toDateStr(now)

  if (dateStr < today) return 'past'
  if (dateStr > today) return 'upcoming'

  // Same day — compare times
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const start = new Date(now); start.setHours(sh, sm, 0, 0)
  const end   = new Date(now); end.setHours(eh, em, 0, 0)
  if (now > end)   return 'past'
  if (now < start) return 'upcoming'
  return 'live'
}

// Returns the first date >= startDateStr that falls on dayNum (1=Mon…5=Fri)
function firstOccurrence(dayNum, startDateStr) {
  const d = new Date(startDateStr + 'T00:00:00')
  while (d.getDay() !== dayNum) d.setDate(d.getDate() + 1)
  return d
}

/**
 * @param {Array}  courses      - Course objects with .shortname, .fullname, .id, .schedule
 *                               schedule can be Flask array format OR Firebase object format
 * @param {string} moodleUserId - Moodle User ID (NOT Firebase UID) - canonical identifier
 * @param {string} semesterKey  - 'S26' | 'F25'
 * @returns {Array} session objects
 */
export function generateSessions(courses, moodleUserId, semesterKey = 'S26') {
  const range = SEMESTER_RANGES[semesterKey]
  if (!range) return []

  const endDate = new Date(range.end + 'T23:59:59')
  const sessions = []

  for (const course of courses) {
    // Normalize schedule to handle both Flask and Firebase formats
    const normalizedSchedule = normalizeSchedule(course.schedule)
    
    if (normalizedSchedule.length === 0) {
      console.warn(`[generateSessions] No valid schedule slots for course ${course.shortname}`)
      continue
    }

    for (const slot of normalizedSchedule) {
      const dayNum = DAY_NUM[slot.day]
      if (dayNum == null) {
        console.warn(`[generateSessions] Invalid day "${slot.day}" in course ${course.shortname}`)
        continue
      }

      const cur = firstOccurrence(dayNum, range.start)

      while (cur <= endDate) {
        const dateStr = toDateStr(cur)
        sessions.push({
          id:             `${course.shortname}-${dateStr}-${slot.starttime}`,
          courseId:       course.shortname,
          moodleCourseId: course.id,
          courseName:     course.fullname,
          professorId:    moodleUserId,
          roomId:         slot.room,
          date:           dateStr,
          startTime:      slot.starttime,
          endTime:        slot.endtime,
          type:           slot.type,
          status:         computeStatus(dateStr, slot.starttime, slot.endtime),
          attendanceRate: null,
          moodleSynced:   false,
        })
        cur.setDate(cur.getDate() + 7)
      }
    }
  }

  return sessions
}
