import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

export default function NotApproved() {
  const navigate = useNavigate()

  async function handleBack() {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface-deep flex items-center justify-center p-4">
      <div className="card w-full max-w-sm text-center">
        <ShieldOff size={32} className="text-slate-600 mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-slate-100 mb-2">Access not granted</h1>
        <p className="text-sm text-slate-400 mb-6">
          Your email is not registered in the system.
          Contact your administrator to request access.
        </p>
        <button onClick={handleBack} className="btn-ghost w-full justify-center">
          Back to login
        </button>
      </div>
    </div>
  )
}
