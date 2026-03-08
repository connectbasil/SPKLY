import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Survey from './pages/Survey'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Contacts from './pages/Contacts'
import Sidebar from './components/Sidebar'
import { ModeProvider, useMode } from './context/ModeContext'

function ScreenBorder() {
  const { mode } = useMode()
  const prevMode = useRef(mode)
  const [opacity, setOpacity] = useState(mode === 'test' ? 0.6 : 0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (prevMode.current === mode) return
    prevMode.current = mode
    clearTimeout(timerRef.current)
    setOpacity(1)
    timerRef.current = setTimeout(() => setOpacity(mode === 'test' ? 0.6 : 0), 2000)
    return () => clearTimeout(timerRef.current)
  }, [mode])

  const color = mode === 'test' ? '#F59E0B' : '#10B981'
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
      border: `3px solid ${color}`,
      opacity,
      transition: 'opacity 0.5s ease',
    }} />
  )
}

function ModeToast() {
  const { mode } = useMode()
  const prevMode = useRef(mode)
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const [displayedMode, setDisplayedMode] = useState(mode)
  const showTimer = useRef(null)
  const fadeTimer = useRef(null)

  useEffect(() => {
    if (prevMode.current === mode) return
    prevMode.current = mode
    clearTimeout(showTimer.current)
    clearTimeout(fadeTimer.current)
    setDisplayedMode(mode)
    setFading(false)
    setVisible(true)
    showTimer.current = setTimeout(() => setFading(true), 2000)
    fadeTimer.current = setTimeout(() => setVisible(false), 2400)
    return () => { clearTimeout(showTimer.current); clearTimeout(fadeTimer.current) }
  }, [mode])

  if (!visible) return null

  const color = displayedMode === 'test' ? '#F59E0B' : '#10B981'
  const label = displayedMode === 'test' ? 'Test Mode' : 'Live Mode'

  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--bg-surface)',
      border: `1px solid ${color}40`,
      borderRadius: 100,
      padding: '8px 18px 8px 14px',
      boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${color}20`,
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.4s ease',
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color,
        boxShadow: `0 0 6px ${color}`,
        flexShrink: 0,
      }} />
      <span style={{
        fontSize: '0.82rem',
        fontWeight: 600,
        color,
        letterSpacing: '-0.01em',
      }}>
        {label}
      </span>
    </div>
  )
}

function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-base)' }}>
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ModeProvider>
      <ScreenBorder />
      <ModeToast />
      <BrowserRouter>
        <Routes>
          <Route path="/survey/:id" element={<Survey />} />
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
          <Route
            path="/admin"
            element={
              <AppLayout>
                <Admin />
              </AppLayout>
            }
          />
          <Route
            path="/contacts"
            element={
              <AppLayout>
                <Contacts />
              </AppLayout>
            }
          />
          <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </ModeProvider>
  )
}
