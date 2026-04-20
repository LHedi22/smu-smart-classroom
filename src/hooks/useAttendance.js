import { ref, update } from 'firebase/database'
import { useObjectVal } from 'react-firebase-hooks/database'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { hasRoomAccess, validateRoomId, logUnauthorizedAccess } from '../utils/roomAccess'

const ALL_NAMES = ['Ahmed Ben Salah','Sarra Trabelsi','Mohamed Amine Jlassi','Rim Chaabane','Yassine Boughanmi','Amira Sassi','Karim Mansour','Leila Hamdi','Oussama Feriani','Nadia Khalfallah','Bilel Cherif','Hajer Arfaoui','Rami Ghodbane','Ines Zribi','Ayoub Haddad','Fatma Jouini','Khalil Dridi','Mariem Boukari','Seifeddine Mrabet','Cyrine Elleuch','Tarek Benzarti','Salma Bahri','Mehdi Karray','Asma Chihi','Nizar Achouri','Dorra Hamrouni','Wassim Selmi','Hana Tlili','Fares Mathlouthi','Yosra Agrebi','Amine Belhaj','Malek Triki']

const MOCK_ATTENDANCE_CONFIG = {
  A101: { count: 32, prefix: '21CS',   presentCount: 29, startHour: '09' },
  C303: { count: 30, prefix: '21MATH', presentCount: 0,  startHour: '11' },
  B204: { count: 28, prefix: '21ISS',  presentCount: 0,  startHour: '14' },
}

function buildMockAttendance({ count, prefix, presentCount, startHour }) {
  return {
    enrolled: count,
    students: Object.fromEntries(
      Array.from({ length: count }, (_, i) => {
        const id = `${prefix}${String(i + 1).padStart(3, '0')}`
        const present = i < presentCount
        return [id, {
          name:             ALL_NAMES[i] ?? `Student ${i + 1}`,
          entryTime:        present ? `${startHour}:0${Math.floor(i / 5)}` : null,
          exitTime:         null,
          present,
          manualOverride:   false,
          overrideNote:     '',
          cameraConfidence: present ? parseFloat((0.85 + Math.random() * 0.14).toFixed(2)) : 0,
        }]
      })
    ),
  }
}

const USE_MOCK    = import.meta.env.VITE_USE_MOCK    === 'true'
const ALWAYS_LIVE = import.meta.env.VITE_ALWAYS_LIVE === 'true'

export function useAttendance(roomId, sessionId) {
  const { profile, user } = useAuth()
  
  // Validate room ID format
  const { valid: roomIdValid, error: roomIdError } = validateRoomId(roomId)
  if (!roomIdValid) {
    return {
      enrolled: 0,
      students: [],
      loading: false,
      error: new Error(`Invalid room ID: ${roomIdError}`),
      updateStudent: async () => { throw new Error('Invalid room ID') }
    }
  }

  // Check authorization: does professor have access to this room?
  if (!hasRoomAccess(profile, roomId)) {
    logUnauthorizedAccess(user?.uid, roomId, 'fetch_attendance', new Date().toISOString())
    return {
      enrolled: 0,
      students: [],
      loading: false,
      error: new Error(`Not authorized to access attendance for room ${roomId}`),
      updateStudent: async () => { throw new Error('Not authorized to update attendance') }
    }
  }

  // Authorization passed: fetch the data
  const [data, loading, error] = useObjectVal(
    USE_MOCK ? null : ref(db, `classrooms/${roomId}/attendance/${sessionId}`)
  )

  const updateStudent = (studentId, changes) => {
    if (USE_MOCK) return Promise.resolve()
    return update(
      ref(db, `classrooms/${roomId}/attendance/${sessionId}/students/${studentId}`),
      changes
    )
  }

  const mockData = (USE_MOCK || (ALWAYS_LIVE && !loading && !data))
    ? buildMockAttendance(MOCK_ATTENDANCE_CONFIG[roomId] ?? MOCK_ATTENDANCE_CONFIG.B204)
    : null
  const source = USE_MOCK ? mockData : (ALWAYS_LIVE && !data ? mockData : data)
  const students = source?.students
    ? Object.entries(source.students).map(([id, v]) => ({ id, ...v }))
    : []

  return {
    enrolled: source?.enrolled ?? 0,
    students,
    loading: USE_MOCK ? false : loading,
    error:   USE_MOCK ? null  : error,
    updateStudent,
  }
}
