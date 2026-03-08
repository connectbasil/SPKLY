import { createContext, useContext, useState } from 'react'

const ModeContext = createContext(null)

export function ModeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('spkly_mode') || 'test')

  function setModeAndPersist(newMode) {
    localStorage.setItem('spkly_mode', newMode)
    setMode(newMode)
  }

  return (
    <ModeContext.Provider value={{ mode, setMode: setModeAndPersist }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const ctx = useContext(ModeContext)
  if (!ctx) throw new Error('useMode must be used inside ModeProvider')
  return ctx
}
