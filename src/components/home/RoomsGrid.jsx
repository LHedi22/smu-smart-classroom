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
    <div className="card flex flex-col gap-3">
      <p className="text-sm font-medium text-slate-400">My Rooms</p>
      <div className="grid grid-cols-2 gap-3">
        {rooms.map(roomId => {
          const isLive = roomStatuses[roomId] != null
          return (
            <button
              key={roomId}
              onClick={() => navigate(`/session/${roomId}`)}
              className={`rounded-xl p-4 text-left transition border
                ${isLive
                  ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
                  : 'border-slate-700/50 bg-slate-800/50 hover:bg-slate-700/50'
                }`}
            >
              <p className="font-bold text-slate-100 text-lg">{roomId}</p>
              <p className={`text-xs mt-1 flex items-center gap-1.5
                ${isLive ? 'text-red-400' : 'text-slate-500'}`}
              >
                {isLive
                  ? <><span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse inline-block" /> Session active</>
                  : <><span className="w-1.5 h-1.5 bg-slate-600 rounded-full inline-block" /> Available</>
                }
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
