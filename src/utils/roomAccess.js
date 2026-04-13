/**
 * Room access control utilities
 * 
 * Provides functions to verify that a user (professor) has authorization
 * to access a specific classroom/room. Used by hooks to prevent unauthorized access.
 */

/**
 * Checks if a professor has access to a room
 * 
 * A professor has access if:
 * 1. They have a profile (authenticated)
 * 2. The room is in their assignedRooms
 * 
 * @param {Object} profile - Professor profile from AuthContext { uid, email, assignedRooms: {roomId: true} }
 * @param {string} roomId - Room identifier to check access for
 * @returns {boolean} true if professor can access the room, false otherwise
 */
export function hasRoomAccess(profile, roomId) {
  // No profile = no access
  if (!profile) return false
  
  // Check if roomId exists in assignedRooms
  return profile.assignedRooms?.[roomId] === true
}

/**
 * Creates an authorization error for a denied room access attempt
 * 
 * @param {string} roomId - The room that was accessed without permission
 * @param {string} operation - What operation was attempted (e.g., "view", "control")
 * @returns {Error} Error object with detailed message
 */
export function createRoomAccessError(roomId, operation = 'access') {
  return new Error(
    `You are not authorized to ${operation} room ${roomId}. ` +
    `Please contact your administrator if you believe this is an error.`
  )
}

/**
 * Logs unauthorized access attempts for security monitoring
 * 
 * @param {string} professorUid - Firebase UID of professor attempting access
 * @param {string} roomId - Room that was accessed
 * @param {string} operation - What they tried to do (e.g., "fetch_sensors", "control_devices")
 * @param {string} timestamp - ISO timestamp of attempt
 */
export function logUnauthorizedAccess(professorUid, roomId, operation, timestamp) {
  // In production, this would log to a security audit trail
  console.warn(
    `[SECURITY] Unauthorized access attempt`,
    {
      professorUid,
      roomId,
      operation,
      timestamp,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
    }
  )
}

/**
 * Validates room parameters before attempting access
 * 
 * @param {string} roomId - Room identifier to validate
 * @returns {Object} { valid: boolean, error: string | null }
 */
export function validateRoomId(roomId) {
  if (!roomId) {
    return { valid: false, error: 'Room ID is required' }
  }
  
  if (typeof roomId !== 'string') {
    return { valid: false, error: 'Room ID must be a string' }
  }
  
  if (roomId.length === 0 || roomId.length > 50) {
    return { valid: false, error: 'Room ID must be 1-50 characters' }
  }
  
  // Allow alphanumeric, hyphens, underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(roomId)) {
    return { valid: false, error: 'Room ID contains invalid characters' }
  }
  
  return { valid: true, error: null }
}

/**
 * Checks if an action on a room requires write access
 * Some operations (read sensors) only need read access,
 * while others (control devices) need write access
 * 
 * @param {string} operation - The operation type
 * @returns {boolean} true if write access required, false if read-only
 */
export function requiresWriteAccess(operation) {
  const writeOperations = [
    'control_devices',
    'toggle_relay',
    'update_device_state',
    'modify_attendance',
    'update_settings'
  ]
  
  return writeOperations.includes(operation)
}
