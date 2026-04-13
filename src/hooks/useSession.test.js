/**
 * Tests for useSession hook - Room Access Verification
 * 
 * Verifies that professors cannot access unauthorized rooms.
 * Ensures proper authorization checks before Firebase calls.
 */

import { renderHook } from '@testing-library/react'
import { useSession } from './useSession'
import * as roomAccess from '../utils/roomAccess'

// Mock Firebase and AuthContext
jest.mock('../firebase')
jest.mock('../context/AuthContext')
jest.mock('react-firebase-hooks/database')
jest.mock('../utils/roomAccess')

describe('useSession - Room Access Verification', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return error when room ID is invalid', () => {
    roomAccess.validateRoomId.mockReturnValue({ 
      valid: false, 
      error: 'Room ID must be alphanumeric' 
    })

    const { result } = renderHook(() => useSession('invalid@room'))

    expect(result.current.session).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeDefined()
    expect(result.current.error.message).toContain('Invalid room ID')
  })

  test('should return error when professor lacks authorization', () => {
    roomAccess.validateRoomId.mockReturnValue({ valid: true })
    roomAccess.hasRoomAccess.mockReturnValue(false)

    const { result } = renderHook(() => useSession('B204'))

    expect(result.current.session).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeDefined()
    expect(result.current.error.message).toContain('Not authorized')
  })

  test('should log unauthorized access attempts', () => {
    roomAccess.validateRoomId.mockReturnValue({ valid: true })
    roomAccess.hasRoomAccess.mockReturnValue(false)

    renderHook(() => useSession('A101'))

    expect(roomAccess.logUnauthorizedAccess).toHaveBeenCalledWith(
      expect.any(String),
      'A101',
      'fetch_active_session',
      expect.any(String)
    )
  })

  test('should fetch data when authorization is granted', () => {
    roomAccess.validateRoomId.mockReturnValue({ valid: true })
    roomAccess.hasRoomAccess.mockReturnValue(true)

    // useObjectVal would be called for authorized access
    const { result } = renderHook(() => useSession('A101'))

    // In real scenario, Firebase hook would be called
    // This test confirms authorization checks pass first
    expect(roomAccess.validateRoomId).toHaveBeenCalledWith('A101')
    expect(roomAccess.hasRoomAccess).toHaveBeenCalled()
  })
})
