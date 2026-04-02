import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

const AuthContext = createContext(null)

const isMock = import.meta.env.VITE_USE_MOCK === 'true'

export function AuthProvider({ children }) {
  // undefined = still loading, null = signed out, object = signed in
  const [professor, setProfessor] = useState(undefined)

  useEffect(() => {
    if (isMock || !auth) {
      const stored = sessionStorage.getItem('mock_professor')
      setProfessor(stored ? JSON.parse(stored) : null)
      return
    }
    return onAuthStateChanged(auth, user => setProfessor(user ?? null))
  }, [])

  return (
    <AuthContext.Provider value={{ professor, setProfessor }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useProfessor = () => useContext(AuthContext)
