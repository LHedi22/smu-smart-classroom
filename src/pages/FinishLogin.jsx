import { useEffect, useState } from 'react'
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import { ref, get, set, remove } from 'firebase/database'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'
import { getProfessorCourses } from '../services/moodleApi'

// Union of (admin-typed rooms) ∪ (rooms derived from Flask course schedule).
// Derived wins ties on presence: if the professor has a Schedule entry in
// room A101, A101 is assigned regardless of what admin typed. Manual entries
// survive for guest/temporary room overrides that don't exist in Schedule.
async function deriveAssignedRooms(manualRooms, moodleUserId) {
  const merged = { ...(manualRooms ?? {}) }
  if (moodleUserId == null) return merged
  try {
    const courses = await getProfessorCourses(moodleUserId)
    for (const c of courses ?? []) {
      for (const s of c.schedule ?? []) {
        if (s.room) merged[s.room] = true
      }
    }
  } catch (err) {
    console.warn('[FinishLogin] Could not derive rooms from Flask — using manual list only:', err?.message)
  }
  return merged
}

export default function FinishLogin() {
  const [message, setMessage] = useState('Signing you in…')
  const navigate = useNavigate()

  useEffect(() => {
    async function completeLogin() {
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        navigate('/login')
        return
      }

      let email = localStorage.getItem('emailForSignIn')
      if (!email) {
        email = window.prompt('Please enter your email address to confirm:')
      }
      if (!email) {
        navigate('/login')
        return
      }

      try {
        const result = await signInWithEmailLink(auth, email, window.location.href)
        localStorage.removeItem('emailForSignIn')
        const user = result.user

        try {
          const adminSnap = await get(ref(db, `admins/${user.uid}`))
          if (adminSnap.exists()) {
            navigate('/admin')
            return
          }
        } catch { /* not an admin */ }

        try {
          const profSnap = await get(ref(db, `professors/${user.uid}`))
          if (profSnap.exists()) {
            navigate('/')
            return
          }
        } catch { /* not yet a professor */ }

        setMessage('Setting up your account…')
        const emailKey = email.replace(/\./g, '_').replace(/@/g, '_at_')
        const pendingSnap = await get(ref(db, `pendingProfessors/${emailKey}`))

        if (pendingSnap.exists()) {
          const pendingData = pendingSnap.val()
          const moodleUserId = pendingData.moodleUserId ?? null
          const assignedRooms = await deriveAssignedRooms(pendingData.assignedRooms, moodleUserId)

          await set(ref(db, `professors/${user.uid}`), {
            ...pendingData,
            assignedRooms,
            email:        user.email,
            moodleUserId,
            createdAt:    new Date().toISOString(),
            settings: {
              thresholds: {
                temperature: { warn: 26, critical: 32 },
                humidity:    { warn: 60, critical: 75 },
                co2:         { warn: 700, critical: 1000 },
              },
              notifications:            { inApp: true, email: true, push: false },
              attendanceWarnThreshold:  70,
              autoSyncMoodle:           true,
            },
          })
          await remove(ref(db, `pendingProfessors/${emailKey}`))
          navigate('/')
        } else {
          navigate('/not-approved')
        }
      } catch (err) {
        console.error('Sign-in error:', err)
        setMessage(`Error (${err.code}): ${err.message}`)
        setTimeout(() => navigate('/login'), 5000)
      }
    }

    completeLogin()
  }, [])

  return (
    <div className="min-h-screen bg-surface-deep flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400 text-sm">{message}</p>
      </div>
    </div>
  )
}
