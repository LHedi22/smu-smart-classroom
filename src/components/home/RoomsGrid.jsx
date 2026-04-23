import { useEffect, useState } from 'react'
import { ref, onValue }        from 'firebase/database'
import { useNavigate }         from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { useAuth }             from '../../context/AuthContext'
import { db }                  from '../../firebase'
import { BYPASS_SESSION_OWNERSHIP } from '../../config'

export default function RoomsGrid() {
  const { profile: professor, user } = useAuth()
  const [roomStatuses, setRoomStatuses] = useState({})
  const navigate                    = useNavigate()

  useEffect(() => {
    if (!professor?.assignedRooms || !db) return

    const unsubs = Object.keys(professor.assignedRooms).map(roomId =>
      onValue(ref(db, `/classrooms/${roomId}/activeSession`), snap => {
        const value = snap.exists() ? snap.val() : null
        const mine = value?.professorUid && user?.uid && value.professorUid === user.uid
        setRoomStatuses(prev => ({
          ...prev,
          [roomId]: mine ? value : null,
        }))
      })
    )

    return () => unsubs.forEach(u => u())
  }, [professor?.assignedRooms, user?.uid])

  const rooms = Object.keys(professor?.assignedRooms ?? {})

  if (!rooms.length) return (
    <div className="card flex flex-col items-center gap-3 py-8 text-center border-dashed">
      <MapPin size={28} className="text-gray-300" />
      <p className="text-gray-600 font-medium text-sm">No classrooms assigned yet</p>
      <p className="text-xs text-gray-400 max-w-xs">
        Contact your administrator to get rooms assigned to your account.
      </p>
    </div>
  )

  return (
    <div className="card flex flex-col gap-3">
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">My Rooms</p>
      <div className="grid grid-cols-2 gap-3">
        {rooms.map(roomId => {
          const isLive = BYPASS_SESSION_OWNERSHIP || roomStatuses[roomId] != null
          return (
            <button
              key={roomId}
              onClick={() => navigate(`/session/${roomId}`)}
              className={`rounded-xl p-4 text-left transition border
                ${isLive
                  ? 'border-brand/30 bg-brand/5 hover:bg-brand/10'
                  : 'border-surface-border bg-surface-raised hover:bg-surface-border'
                }`}
            >
              <p className="font-bold text-gray-800 text-lg">{roomId}</p>
              <p className={`text-xs mt-1 flex items-center gap-1.5
                ${isLive ? 'text-brand' : 'text-gray-400'}`}
              >
                {isLive
                  ? <><span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse inline-block" /> Session active</>
                  : <><span className="w-1.5 h-1.5 bg-gray-300 rounded-full inline-block" /> Available</>
                }
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
