import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../../api'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export default function MoodleSyncButton({ courseId, sessionId, students }) {
  const [status, setStatus] = useState('idle') // idle | syncing | done | error

  const handleSync = async () => {
    setStatus('syncing')
    if (USE_MOCK) {
      setTimeout(() => setStatus('done'), 1200)
      return
    }
    try {
      const records = students.map(s => ({ studentId: s.id, present: s.present }))
      await api.post('/api/moodle/attendance/sync', { courseId, sessionId, records })
      setStatus('done')
    } catch {
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
      {status === 'syncing' ? 'Syncing…' : status === 'done' ? 'Synced to Moodle' : status === 'error' ? 'Sync failed — retry' : 'Sync to Moodle'}
    </button>
  )
}
