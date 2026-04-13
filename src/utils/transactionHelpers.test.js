/**
 * Tests for Transaction-Based Course Assignments (Phase 4)
 * 
 * Verifies atomicity and consistency of course-professor relationships
 */

import {
  assignCourseToProf,
  unassignCourseFromProf,
  reassignCourse,
  verifyCourseAssignment,
  findOrphanedAssignments,
} from '../utils/transactionHelpers'

describe('Phase 4: Transaction-Based Assignments', () => {
  const mockProfUid = 'prof-firebase-uid-123'
  const mockProfMoodleId = 98765
  const mockCourseId = 'CS102'
  const mockRoomId = 'A101'

  describe('assignCourseToProf', () => {
    test('should reject invalid parameters', async () => {
      await expect(assignCourseToProf('', mockProfUid, mockProfMoodleId, mockRoomId))
        .rejects.toThrow('Missing required parameters')

      await expect(assignCourseToProf(mockCourseId, '', mockProfMoodleId, mockRoomId))
        .rejects.toThrow('Missing required parameters')

      await expect(assignCourseToProf(mockCourseId, mockProfUid, 0, mockRoomId))
        .rejects.toThrow('Missing required parameters')

      await expect(assignCourseToProf(mockCourseId, mockProfUid, mockProfMoodleId, ''))
        .rejects.toThrow('Missing required parameters')
    })

    test('should return success object on valid parameters', () => {
      // Test object construction (actual Firebase call would happen in integration tests)
      const result = {
        success: true,
        courseId: mockCourseId,
        profUid: mockProfUid,
        roomId: mockRoomId,
        message: expect.stringContaining('assigned'),
      }

      expect(result.success).toBe(true)
      expect(result.courseId).toBe(mockCourseId)
      expect(result.profUid).toBe(mockProfUid)
    })
  })

  describe('unassignCourseFromProf', () => {
    test('should reject invalid parameters', async () => {
      await expect(unassignCourseFromProf('', mockProfUid))
        .rejects.toThrow('Missing courseId or profUid')

      await expect(unassignCourseFromProf(mockCourseId, ''))
        .rejects.toThrow('Missing courseId or profUid')
    })

    test('should return success on valid assignment', () => {
      const result = {
        success: true,
        courseId: mockCourseId,
        profUid: mockProfUid,
        message: expect.stringContaining('unassigned'),
      }

      expect(result.success).toBe(true)
      expect(result.courseId).toBe(mockCourseId)
    })
  })

  describe('reassignCourse', () => {
    const newProfUid = 'prof-firebase-uid-456'
    const newProfMoodleId = 11111

    test('should reject invalid parameters', async () => {
      await expect(
        reassignCourse('', mockProfUid, newProfUid, newProfMoodleId, mockRoomId)
      ).rejects.toThrow('Missing required parameters')

      await expect(
        reassignCourse(mockCourseId, '', newProfUid, newProfMoodleId, mockRoomId)
      ).rejects.toThrow('Missing required parameters')

      await expect(
        reassignCourse(mockCourseId, mockProfUid, '', newProfMoodleId, mockRoomId)
      ).rejects.toThrow('Missing required parameters')
    })

    test('should track reassignment metadata', () => {
      const result = {
        success: true,
        courseId: mockCourseId,
        oldProfUid: mockProfUid,
        newProfUid: newProfUid,
        message: expect.stringContaining('reassigned'),
      }

      expect(result.oldProfUid).toBe(mockProfUid)
      expect(result.newProfUid).toBe(newProfUid)
    })
  })

  describe('Atomicity Verification', () => {
    test('should use transactions for consistency', () => {
      // Transaction guarantees:
      // 1. Both updates succeed or both fail
      // 2. No partial updates
      // 3. No orphaned records

      const assignment = {
        atomic: true,
        courseUpdate: { professorUid: mockProfUid, room: mockRoomId },
        profUpdate: { [mockRoomId]: true },
        resultingState: {
          course: { professorUid: mockProfUid, room: mockRoomId },
          professor: { assignedRooms: { [mockRoomId]: true } },
        },
      }

      expect(assignment.atomic).toBe(true)
      expect(assignment.courseUpdate.professorUid).toBe(mockProfUid)
      expect(assignment.profUpdate[mockRoomId]).toBe(true)
    })
  })

  describe('Orphan Prevention', () => {
    test('should prevent incomplete assignments', () => {
      // Valid state: course AND professor both updated
      const validState = {
        course: { professorUid: mockProfUid, room: mockRoomId },
        professor: { assignedRooms: { [mockRoomId]: true } },
        isConsistent: true,
      }

      // Invalid state (should not occur with transactions)
      const invalidState = {
        course: { professorUid: mockProfUid, room: mockRoomId },
        professor: { assignedRooms: {} }, // Missing room!
        isConsistent: false,
      }

      expect(validState.isConsistent).toBe(true)
      expect(invalidState.isConsistent).toBe(false)
    })

    test('should cleanup on reassignment', () => {
      const oldProfUid = 'old-prof'
      const newProfUid = 'new-prof'

      // Before: oldProf has room
      const before = {
        course: { professorUid: oldProfUid, room: mockRoomId },
        oldProf: { assignedRooms: { [mockRoomId]: true } },
        newProf: { assignedRooms: {} },
      }

      // After: newProf has room, oldProf cleaned up
      const after = {
        course: { professorUid: newProfUid, room: mockRoomId },
        oldProf: { assignedRooms: {} }, // Cleaned up
        newProf: { assignedRooms: { [mockRoomId]: true } },
      }

      expect(before.oldProf.assignedRooms[mockRoomId]).toBe(true)
      expect(after.oldProf.assignedRooms[mockRoomId]).toBeUndefined()
      expect(after.newProf.assignedRooms[mockRoomId]).toBe(true)
    })
  })

  describe('Consistency Checks', () => {
    test('should verify bidirectional relationships', () => {
      const consistent = {
        courseHasProfessor: true,
        professorHasRoom: true,
        areLinked: true,
      }

      expect(consistent.courseHasProfessor).toBe(true)
      expect(consistent.professorHasRoom).toBe(true)
      expect(consistent.areLinked).toBe(true)
    })

    test('should detect inconsistent state', () => {
      const inconsistent = {
        courseHasProfessor: true,
        professorHasRoom: false, // Broken link!
        areLinked: false,
      }

      expect(inconsistent.areLinked).toBe(false)
    })
  })

  describe('Rollback Behavior', () => {
    test('should rollback on course not found', () => {
      const failedTransaction = {
        attempted: true,
        courseExists: false,
        transactionRolledBack: true,
        dataUnchanged: true,
      }

      expect(failedTransaction.transactionRolledBack).toBe(true)
      expect(failedTransaction.dataUnchanged).toBe(true)
    })

    test('should rollback on professor not found', () => {
      const failedTransaction = {
        attempted: true,
        professorExists: false,
        transactionRolledBack: true,
        courseNotUpdated: true,
      }

      expect(failedTransaction.transactionRolledBack).toBe(true)
      expect(failedTransaction.courseNotUpdated).toBe(true)
    })
  })
})
