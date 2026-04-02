import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useProfessor } from '../context/AuthContext'
import { Cpu, AlertCircle } from 'lucide-react'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export default function Login() {
  const navigate  = useNavigate()
  const { setProfessor } = useProfessor()
  const [email,   setEmail]   = useState('')
  const [password,setPassword]= useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (USE_MOCK) {
      const mockUser = { uid: 'mock', email, displayName: email.split('@')[0] }
      sessionStorage.setItem('mock_professor', JSON.stringify(mockUser))
      setProfessor(mockUser)
      setTimeout(() => navigate('/'), 400)
      return
    }

    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (err) {
      setError(err.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-deep flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-brand/10 rounded-xl border border-brand/20">
            <Cpu size={24} className="text-brand" />
          </div>
          <div>
            <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">SMU</p>
            <h1 className="text-lg font-semibold text-slate-100 leading-tight">Smart Classroom</h1>
          </div>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="text-slate-200 font-semibold mb-1">Professor sign-in</h2>
          <p className="text-sm text-slate-500 mb-6">Use your SMU institutional email.</p>

          {error && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-red-400/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="a.mejri@smu.tn"
                className="bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm
                           text-slate-200 placeholder-slate-600 outline-none
                           focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm
                           text-slate-200 placeholder-slate-600 outline-none
                           focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors"
              />
            </label>
            <button type="submit" disabled={loading} className="btn-primary mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {USE_MOCK && (
            <p className="mt-4 text-center text-xs text-amber-400/70">
              Mock mode — any credentials accepted
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
