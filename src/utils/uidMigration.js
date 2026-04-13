/**
 * Migration Helper: Fix existing sessions with wrong UID
 * 
 * Background:
 * - Old sessions stored professorUid as Firebase UID
 * - New sessions should store professorId as moodleUserId
 * - This utility helps migrate existing data
 * 
 * Usage:
 * 1. Import and call migrateSessionUIDs when needed
 * 2. Pass professors map and sessions to fix
 * 3. Returns migrated sessions ready to save
 */

/**
 * Creates a map of Firebase UID → moodleUserId for quick lookup
 * @param {Array} professors - Professor objects from Firebase
 * @returns {Object} { firebaseUid → moodleUserId }
 */
export function createUIDMap(professors) {
  return professors.reduce((acc, prof) => {
    if (prof.uid && prof.moodleUserId) {
      acc[prof.uid] = prof.moodleUserId
    }
    return acc
  }, {})
}

/**
 * Migrates a session from old format to new format
 * @param {Object} session - Session object with professorUid
 * @param {Object} uidMap - Map of firebaseUid → moodleUserId
 * @returns {Object} Migrated session with professorId field
 */
export function migrateSession(session, uidMap) {
  // If already migrated, return as-is
  if (session.professorId && !session.professorUid) {
    return session
  }

  // Migrate from professorUid to professorId
  const moodleUserId = session.professorUid ? uidMap[session.professorUid] : null

  return {
    ...session,
    professorId: moodleUserId || session.professorId,
    // Keep old field for compatibility during transition
    professorUid: session.professorUid,
  }
}

/**
 * Batch migrate multiple sessions
 * @param {Array} sessions - Sessions to migrate
 * @param {Object} uidMap - Map of firebaseUid → moodleUserId
 * @returns {Array} Migrated sessions
 */
export function migrateSessions(sessions, uidMap) {
  return sessions.map(s => migrateSession(s, uidMap))
}

/**
 * Validates that a session has proper UID format
 * @param {Object} session - Session to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateSessionUIDs(session) {
  const errors = []

  // Must have one of: professorId (new) or professorUid (old)
  if (!session.professorId && !session.professorUid) {
    errors.push('Session missing both professorId and professorUid')
  }

  // If has professorId, should be numeric (Moodle ID)
  if (session.professorId && typeof session.professorId !== 'number') {
    const asNum = parseInt(session.professorId, 10)
    if (isNaN(asNum)) {
      errors.push(`professorId "${session.professorId}" is not numeric`)
    }
  }

  // If has professorUid, should be string (Firebase UID)
  if (session.professorUid && typeof session.professorUid !== 'string') {
    errors.push(`professorUid must be string, got ${typeof session.professorUid}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Report on migration status
 * @param {Array} sessions - Sessions to analyze
 * @param {Object} uidMap - Map of firebaseUid → moodleUserId
 * @returns {Object} Migration statistics
 */
export function analyzeMigrationStatus(sessions, uidMap) {
  let needsMigration = 0
  let alreadyMigrated = 0
  let unmappable = 0
  const issues = []

  for (const session of sessions) {
    // Already migrated: has professorId, may have professorUid
    if (session.professorId && typeof session.professorId === 'number') {
      alreadyMigrated++
    }
    // Needs migration: has professorUid but no professorId
    else if (session.professorUid && !session.professorId) {
      const moodleId = uidMap[session.professorUid]
      if (moodleId) {
        needsMigration++
      } else {
        unmappable++
        issues.push(`Session ${session.id}: professorUid ${session.professorUid} not found in map`)
      }
    }
    // Both missing
    else if (!session.professorUid && !session.professorId) {
      issues.push(`Session ${session.id}: missing both UIDs`)
    }
  }

  return {
    total: sessions.length,
    alreadyMigrated,
    needsMigration,
    unmappable,
    issues,
  }
}

/**
 * Example: How to use this for a one-time migration
 * 
 * async function runMigration() {
 *   // 1. Fetch all professors and sessions from Firebase
 *   const professorSnap = await get(ref(db, 'professors'))
 *   const sessionsSnap = await get(ref(db, 'sessions'))
 *   
 *   const professors = Object.entries(professorSnap.val()).map(([uid, v]) => ({uid, ...v}))
 *   const sessions = Object.entries(sessionsSnap.val()).map(([id, v]) => ({id, ...v}))
 *   
 *   // 2. Create UID map
 *   const uidMap = createUIDMap(professors)
 *   
 *   // 3. Analyze current state
 *   const status = analyzeMigrationStatus(sessions, uidMap)
 *   console.log('Migration Status:', status)
 *   
 *   // 4. Migrate sessions
 *   const migrated = migrateSessions(sessions, uidMap)
 *   
 *   // 5. Write back to Firebase (in a batch or transaction)
 *   for (const session of migrated) {
 *     await update(ref(db, `sessions/${session.id}`), {
 *       professorId: session.professorId,
 *     })
 *   }
 *   
 *   console.log('Migration complete')
 * }
 */
