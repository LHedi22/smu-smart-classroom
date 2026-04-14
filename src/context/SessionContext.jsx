import { createContext, useContext, useState } from 'react'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [activeRoom, setActiveRoom]       = useState(null)
  const [activeSessionId, setActiveSessionId] = useState(null)

  return (
    <SessionContext.Provider value={{ activeRoom, setActiveRoom, activeSessionId, setActiveSessionId }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useActiveRoom = () => useContext(SessionContext)
