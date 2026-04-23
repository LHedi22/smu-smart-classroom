import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { ref, update } from 'firebase/database'
import { db } from '../../firebase'
import api from '../../api'
import { USE_MOCK_SESSIONS } from '../../config'

export default function MoodleSyncButton({ courseId, moodleCourseId, sessionId, students }) {
  const [status, setStatus] = useState('idle') // idle | syncing | done | error
  const [errorMsg, setErrorMsg] = useState(null)

  const handleSync = async () => {
    setStatus('syncing')
    setErrorMsg(null)

    if (USE_MOCK_SESSIONS) {
      setTimeout(() => setStatus('done'), 1200)
      return
    }

    try {
      const records = students.map(s => ({ studentId: s.id, present: s.present }))
      const res = await api.post('/api/moodle/attendance/sync', {
        courseId,
        moodleCourseId,
        sessionId,
        records,
      })

      // Write moodleSynced flag back to the session record in Firebase
      if (sessionId) {
        await update(ref(db, `/sessions/${sessionId}`), { moodleSynced: true })
      }

      setStatus('done')
      return res.data
    } catch (err) {
      setErrorMsg(err?.response?.data?.message ?? 'Sync failed')
      setStatus('error')
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={status === 'syncing' || status === 'done'}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
        ${status === 'done'    ? 'bg-green-50 text-green-700 border border-green-200 cursor-default' :
          status === 'error'   ? 'bg-red-50 text-red-600 border border-red-200' :
          status === 'syncing' ? 'opacity-60 cursor-not-allowed bg-surface-raised text-gray-400' :
          'bg-brand/10 text-brand border border-brand/30 hover:bg-brand/20'}`}
    >
      {status === 'syncing' && <RefreshCw size={15} className="animate-spin" />}
      {status === 'done'    && <CheckCircle size={15} />}
      {status === 'error'   && <AlertCircle size={15} />}
      {status === 'idle'    && <RefreshCw size={15} />}
      {status === 'syncing' ? 'Syncing…'
        : status === 'done'    ? 'Synced to Moodle'
        : status === 'error'   ? (errorMsg ?? 'Sync failed — retry')
        : 'Sync to Moodle'}
    </button>
  )
}
