/**
 * Tests for UID Consistency (Phase 3)
 * 
 * Verifies that all session records use moodleUserId (professorId)
 * consistently across all sources.
 */

import { generateSessions } from '../utils/generateSessions'
import { createUIDMap, migrateSession, validateSessionUIDs, analyzeMigrationStatus } from '../utils/uidMigration'

describe('Phase 3: UID Consistency', () => {
  const mockProfessors = [
    { uid: 'firebase-uid-1', moodleUserId: 12345, name: 'Prof A' },
    { uid: 'firebase-uid-2', moodleUserId: 67890, name: 'Prof B' },
  ]

  const mockCourses = [
    {
      id: 10001,
      shortname: 'CS102',
      fullname: 'OOP',
      schedule: [
        { day: 'Monday', starttime: '09:00', endtime: '10:30', room: 'A101', type: 'Lecture' },
      ],
    },
  ]

  describe('generateSessions with moodleUserId', () => {
    test('should use moodleUserId as professorId', () => {
      const sessions = generateSessions(mockCourses, 12345, 'S26')
      
      expect(sessions.length).toBeGreaterThan(0)
      expect(sessions[0].professorId).toBe(12345)
      expect(sessions[0].professorUid).toBeUndefined()
    })

    test('should generate consistent session IDs', () => {
      const sessions = generateSessions(mockCourses, 12345, 'S26')
      
      // Session ID format: CS102-2026-MM-DD-HH:MM
      expect(sessions[0].id).toMatch(/^CS102-\d{4}-\d{2}-\d{2}-\d{2}:\d{2}$/)
    })

    test('should include all required fields', () => {
      const sessions = generateSessions(mockCourses, 12345, 'S26')
      const session = sessions[0]

      expect(session.id).toBeDefined()
      expect(session.courseId).toBe('CS102')
      expect(session.courseName).toBe('OOP')
      expect(session.professorId).toBe(12345)
      expect(session.roomId).toBe('A101')
      expect(session.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(session.startTime).toBe('09:00')
      expect(session.endTime).toBe('10:30')
    })
  })

  describe('UID Migration', () => {
    test('should create UID map', () => {
      const uidMap = createUIDMap(mockProfessors)

      expect(uidMap['firebase-uid-1']).toBe(12345)
      expect(uidMap['firebase-uid-2']).toBe(67890)
    })

    test('should migrate old session to new format', () => {
      const oldSession = {
        id: 'CS102-2026-04-01-09:00',
        courseId: 'CS102',
        professorUid: 'firebase-uid-1',
      }

      const uidMap = createUIDMap(mockProfessors)
      const migrated = migrateSession(oldSession, uidMap)

      expect(migrated.professorId).toBe(12345)
      expect(migrated.professorUid).toBe('firebase-uid-1')
    })

    test('should not duplicate migration', () => {
      const newSession = {
        id: 'CS102-2026-04-01-09:00',
        courseId: 'CS102',
        professorId: 12345,
      }

      const uidMap = createUIDMap(mockProfessors)
      const result = migrateSession(newSession, uidMap)

      expect(result.professorId).toBe(12345)
      expect(result.professorUid).toBeUndefined()
    })
  })

  describe('Session UID Validation', () => {
    test('should validate new format session', () => {
      const session = {
        id: 'CS102-2026-04-01-09:00',
        courseId: 'CS102',
        professorId: 12345,
      }

      const result = validateSessionUIDs(session)
      expect(result.valid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    test('should detect missing UIDs', () => {
      const session = {
        id: 'CS102-2026-04-01-09:00',
        courseId: 'CS102',
      }

      const result = validateSessionUIDs(session)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('missing both'))
    })

    test('should detect invalid professorId type', () => {
      const session = {
        id: 'CS102-2026-04-01-09:00',
        courseId: 'CS102',
        professorId: 'not-a-number',
      }

      const result = validateSessionUIDs(session)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Migration Status Analysis', () => {
    test('should analyze migration status', () => {
      const sessions = [
        { id: 's1', professorId: 12345 },
        { id: 's2', professorUid: 'firebase-uid-1' },
        { id: 's3', professorUid: 'firebase-uid-unknown' },
      ]

      const uidMap = createUIDMap(mockProfessors)
      const status = analyzeMigrationStatus(sessions, uidMap)

      expect(status.total).toBe(3)
      expect(status.alreadyMigrated).toBe(1)
      expect(status.needsMigration).toBe(1)
      expect(status.unmappable).toBe(1)
    })
  })

  describe('Query Compatibility', () => {
    test('should query by professorId (new)', () => {
      // Simulates Firebase query: orderByChild('professorId').equalTo(12345)
      const sessions = generateSessions(mockCourses, 12345, 'S26')
      const filtered = sessions.filter(s => s.professorId === 12345)

      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.every(s => s.professorId === 12345)).toBe(true)
    })

    test('should NOT find by old professorUid', () => {
      const sessions = generateSessions(mockCourses, 12345, 'S26')
      const filtered = sessions.filter(s => s.professorUid === 'firebase-uid-1')

      expect(filtered.length).toBe(0)
    })
  })
})
