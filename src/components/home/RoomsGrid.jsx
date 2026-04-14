import { useEffect, useState } from 'react'
import { ref, onValue }        from 'firebase/database'
import { useNavigate }         from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { db }                  from '../../firebase'

export default function RoomsGrid() {
  const { profile: professor, user } = useAuth()
  const [roomStatuses, setRoomStatuses] = useState({})
  const navigate                    = useNavigate()

  useEffect(() => {
    if (!professor?.assignedRooms || !db) return

    const unsubs = Object.keys(professor.assignedRooms).map(roomId =>
      onValue(ref(db, `/classrooms/${roomId}/activeSession`), snap => {
        const value = snap.exists() ? snap.val() : null
        const mine =
          value &&
          (
            (value.professorUid && user?.uid && value.professorUid === user.uid) ||
            (
              value.professorId != null &&
              professor?.moodleUserId != null &&
              Number(value.professorId) === Number(professor.moodleUserId)
            )
          )
        setRoomStatuses(prev => ({
          ...prev,
          [roomId]: mine ? value : null,
        }))
      })
    )

    return () => unsubs.forEach(u => u())
  }, [professor?.assignedRooms, professor?.moodleUserId, user?.uid])

  const rooms = Object.keys(professor?.assignedRooms ?? {})
  if (!rooms.length) return null

  return (
    <section className="card flex flex-col gap-3" aria-label="Assigned rooms">
      <p className="text-sm font-medium uppercase tracking-wide text-[color:var(--fg-muted)]">My Rooms</p>
      <div className="cq-grid-2">
        {rooms.map(roomId => {
          const isLive = roomStatuses[roomId] != null
          return (
            <button
              key={roomId}
              onClick={() => navigate(`/session/${roomId}`)}
              className={`rounded-[14px] border p-4 text-left transition-all duration-150 hover:-translate-y-0.5
                ${isLive
                  ? 'border-[color:var(--accent-danger)]/35 bg-[color:var(--accent-danger)]/8 hover:bg-[color:var(--accent-danger)]/12'
                  : 'border-[color:var(--border-muted)] bg-[color:var(--bg-surface-muted)] hover:bg-[color:var(--bg-surface)]'
                }`}
            >
              <p className="text-lg font-semibold text-[color:var(--fg-default)]">{roomId}</p>
              <p className={`mt-1 flex items-center gap-1.5 text-xs
                ${isLive ? 'text-[color:var(--accent-danger)]' : 'text-[color:var(--fg-muted)]'}`}
              >
                {isLive
                  ? <><span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--accent-danger)]" /> Session active</>
                  : <><span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--fg-muted)]/65" /> Available</>
                }
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
