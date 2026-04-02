import { ref } from 'firebase/database'
import { useObjectVal } from 'react-firebase-hooks/database'
import { db } from '../firebase'
import { MOCK_SESSIONS } from '../data/mockSessions'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function useSessionDetail(sessionId) {
  const [data, loading, error] = useObjectVal(
    (!USE_MOCK && db && sessionId) ? ref(db, `sessions/${sessionId}`) : null
  )

  if (USE_MOCK) {
    const session = MOCK_SESSIONS.find(s => s.id === sessionId) ?? null
    return { session, loading: false, error: null }
  }

  return { session: data ? { id: sessionId, ...data } : null, loading, error }
}
