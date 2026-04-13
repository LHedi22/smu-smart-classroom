/**
 * Schedule format helpers
 * 
 * This module standardizes schedule formats across Flask (Moodle) and Firebase sources.
 * 
 * Canonical format (array of slots):
 * [
 *   {day: "Monday", starttime: "09:00", endtime: "10:30", room: "A101", type: "Lecture"}
 * ]
 * 
 * Legacy Firebase format (object):
 * {days: ["Monday", "Wednesday"], startTime: "09:00", endTime: "10:30", room: "A101"}
 */

/**
 * Normalizes a schedule to canonical Flask format (array of slots)
 * Handles both Flask format (already normalized) and Firebase format (object)
 * 
 * @param {Array|Object} schedule - Schedule data in any supported format
 * @returns {Array} Normalized schedule as array of slots with {day, starttime, endtime, room, type}
 */
export function normalizeSchedule(schedule) {
  // Handle null/undefined
  if (!schedule) return []

  // Already in array format (Flask/canonical)
  if (Array.isArray(schedule)) {
    return schedule.filter(slot => slot && slot.day).map(slot => ({
      day: slot.day,
      starttime: slot.starttime || slot.startTime || '',
      endtime: slot.endtime || slot.endTime || '',
      room: slot.room || '',
      type: slot.type || 'Lecture'
    }))
  }

  // Firebase object format: {days: [], startTime, endTime, room, type}
  if (
    schedule.days &&
    Array.isArray(schedule.days) &&
    schedule.startTime &&
    schedule.endTime
  ) {
    return schedule.days.map(day => ({
      day,
      starttime: schedule.startTime,
      endtime: schedule.endTime,
      room: schedule.room || '',
      type: schedule.type || 'Lecture'
    }))
  }

  // Unrecognized format
  console.warn('[scheduleHelpers] Unrecognized schedule format:', schedule)
  return []
}

/**
 * Converts normalized schedule (array) to Firebase storage format
 * This is called before saving courses to Firebase
 * 
 * @param {Array} slots - Array of schedule slots
 * @returns {Object} Firebase-optimized format with {days: [], startTime, endTime}
 */
export function toFirebaseFormat(slots) {
  if (!Array.isArray(slots) || slots.length === 0) {
    return { days: [], startTime: '', endTime: '' }
  }

  // Group by time to find unique time slots
  const uniqueTimes = {}
  slots.forEach(slot => {
    const key = `${slot.starttime}|${slot.endtime}`
    if (!uniqueTimes[key]) {
      uniqueTimes[key] = { startTime: slot.starttime, endTime: slot.endtime, days: [] }
    }
    if (!uniqueTimes[key].days.includes(slot.day)) {
      uniqueTimes[key].days.push(slot.day)
    }
  })

  // If multiple time slots, take the first one (common case: same time multiple days)
  const times = Object.values(uniqueTimes)
  if (times.length === 0) return { days: [], startTime: '', endTime: '' }

  const first = times[0]
  return {
    days: first.days,
    startTime: first.startTime,
    endTime: first.endTime,
    room: slots[0]?.room || '',
    type: slots[0]?.type || 'Lecture'
  }
}

/**
 * Validates that a normalized schedule is valid
 * 
 * @param {Array} schedule - Schedule in canonical format
 * @returns {Object} {valid: boolean, errors: string[]}
 */
export function validateSchedule(schedule) {
  const errors = []

  if (!Array.isArray(schedule)) {
    errors.push('Schedule must be an array')
    return { valid: false, errors }
  }

  if (schedule.length === 0) {
    errors.push('Schedule cannot be empty')
    return { valid: false, errors }
  }

  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const timeRegex = /^\d{2}:\d{2}$/

  schedule.forEach((slot, idx) => {
    if (!slot.day) {
      errors.push(`Slot ${idx}: Missing day`)
    } else if (!validDays.includes(slot.day)) {
      errors.push(`Slot ${idx}: Invalid day "${slot.day}"`)
    }

    if (!slot.starttime) {
      errors.push(`Slot ${idx}: Missing starttime`)
    } else if (!timeRegex.test(slot.starttime)) {
      errors.push(`Slot ${idx}: Invalid starttime format "${slot.starttime}" (use HH:MM)`)
    }

    if (!slot.endtime) {
      errors.push(`Slot ${idx}: Missing endtime`)
    } else if (!timeRegex.test(slot.endtime)) {
      errors.push(`Slot ${idx}: Invalid endtime format "${slot.endtime}" (use HH:MM)`)
    }

    if (!slot.room) {
      errors.push(`Slot ${idx}: Missing room`)
    }
  })

  return { valid: errors.length === 0, errors }
}

/**
 * Parses comma-separated day string to array
 * Handles variations like "Monday, Wednesday" or "Mon, Wed"
 * 
 * @param {string} dayStr - Comma-separated day names
 * @returns {Array} Array of full day names
 */
export function parseDayString(dayStr) {
  if (!dayStr) return []

  const dayMap = {
    'mon': 'Monday',
    'monday': 'Monday',
    'tue': 'Tuesday',
    'tuesday': 'Tuesday',
    'wed': 'Wednesday',
    'wednesday': 'Wednesday',
    'thu': 'Thursday',
    'thursday': 'Thursday',
    'fri': 'Friday',
    'friday': 'Friday',
    'sat': 'Saturday',
    'saturday': 'Saturday',
    'sun': 'Sunday',
    'sunday': 'Sunday'
  }

  return dayStr
    .split(',')
    .map(d => d.trim().toLowerCase())
    .map(d => dayMap[d] || null)
    .filter(d => d !== null)
}

/**
 * Expands a single time slot across multiple days into an array of daily slots
 * 
 * @param {string} dayString - Comma-separated days
 * @param {string} startTime - Start time HH:MM
 * @param {string} endTime - End time HH:MM
 * @param {string} room - Room identifier
 * @param {string} type - Session type (Lecture, Lab, etc.)
 * @returns {Array} Array of normalized slots
 */
export function expandSlots(dayString, startTime, endTime, room, type = 'Lecture') {
  const days = parseDayString(dayString)
  return days.map(day => ({
    day,
    starttime: startTime,
    endtime: endTime,
    room,
    type
  }))
}
