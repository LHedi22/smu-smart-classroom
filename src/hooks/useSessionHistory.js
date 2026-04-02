import { ref, query, orderByChild, equalTo } from 'firebase/database'
import { useListVals } from 'react-firebase-hooks/database'
import { db } from '../firebase'
import { MOCK_SESSIONS } from '../data/mockSessions'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function useSessionHistory(professorUid) {
  const dbQuery = (!USE_MOCK && db && professorUid)
    ? query(ref(db, 'sessions'), orderByChild('professorUid'), equalTo(professorUid))
    : null

  const [data, loading, error] = useListVals(dbQuery, { keyField: 'id' })

  if (USE_MOCK) return { sessions: MOCK_SESSIONS, loading: false, error: null }

  const sorted = (data ?? []).slice().sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  return { sessions: sorted, loading, error }
}
