import { useParams } from 'react-router-dom'
import { adminApi } from '../../services/adminApi'
import { useAdminResource } from '../../hooks/useAdminResource'
import { AsyncState } from '../../components/admin/common/AsyncState'
import TimelineReplay from '../../components/admin/timeline/TimelineReplay'

export default function AdminSessionTimeline() {
  const { sessionId } = useParams()
  const { data, loading, error } = useAdminResource(
    () => adminApi.getSessionTimeline(sessionId),
    [sessionId]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Session Timeline Replay</h1>
        <p className="text-sm text-slate-500">Session {sessionId} · Replay ordered events and investigate anomalies.</p>
      </div>

      <AsyncState loading={loading} error={error}>
        <TimelineReplay events={data?.events ?? []} />
      </AsyncState>
    </div>
  )
}

