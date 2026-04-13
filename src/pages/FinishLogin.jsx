import { useEffect, useState } from 'react'
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import { ref, get, set, remove } from 'firebase/database'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'

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

        // Check admin (may be permission-denied for non-admins — that's expected)
        try {
          const adminSnap = await get(ref(db, `admins/${user.uid}`))
          if (adminSnap.exists()) {
            navigate('/admin')
            return
          }
        } catch { /* not an admin */ }

        // Check existing professor
        try {
          const profSnap = await get(ref(db, `professors/${user.uid}`))
          if (profSnap.exists()) {
            navigate('/')
            return
          }
        } catch { /* not yet a professor */ }

        // Check pending registration
        setMessage('Setting up your account…')
        const emailKey = email.replace(/\./g, '_').replace(/@/g, '_at_')
        const pendingSnap = await get(ref(db, `pendingProfessors/${emailKey}`))

        if (pendingSnap.exists()) {
          await set(ref(db, `professors/${user.uid}`), {
            ...pendingSnap.val(),
            email:        user.email,
            moodleUserId: null,
            createdAt:    new Date().toISOString(),
            settings: {
              thresholds: {
                temperature: { warn: 26, critical: 32 },
                humidity:    { warn: 60, critical: 75 },
                air_quality: { warn: 700, critical: 1000 },
                sound:       { warn: 65, critical: 80 },
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
        <p className="text-slate-400 text-sm">{message}</p>
      </div>
    </div>
  )
}
