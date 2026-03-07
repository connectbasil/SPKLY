import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import WaveformAnimation from '../components/WaveformAnimation'

const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID || ''
const VAPI_API_KEY = import.meta.env.VITE_VAPI_API_KEY || ''

// States: idle | connecting | active | ended
export default function Survey() {
  const { id } = useParams()
  const [callState, setCallState] = useState('idle')
  const [duration, setDuration] = useState(0)
  const vapiRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      if (vapiRef.current) {
        try { vapiRef.current.stop() } catch (_) {}
      }
    }
  }, [])

  async function startCall() {
    setCallState('connecting')

    // If Vapi keys are present, use real SDK
    if (VAPI_API_KEY && VAPI_ASSISTANT_ID) {
      try {
        const { default: Vapi } = await import('@vapi-ai/web')
        const vapi = new Vapi(VAPI_API_KEY)
        vapiRef.current = vapi

        vapi.on('call-start', () => {
          setCallState('active')
          timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
        })

        vapi.on('call-end', () => {
          setCallState('ended')
          clearInterval(timerRef.current)
        })

        vapi.on('error', (err) => {
          console.error('Vapi error:', err)
          setCallState('idle')
          clearInterval(timerRef.current)
        })

        await vapi.start(VAPI_ASSISTANT_ID, {
          metadata: { survey_uuid: id },
        })
      } catch (err) {
        console.error('Failed to start Vapi call:', err)
        setCallState('idle')
      }
    } else {
      // Demo mode — simulate a call
      setTimeout(() => {
        setCallState('active')
        timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
      }, 1200)
    }
  }

  function endCall() {
    clearInterval(timerRef.current)
    if (vapiRef.current) {
      try { vapiRef.current.stop() } catch (_) {}
    }
    setCallState('ended')
  }

  function formatDuration(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, '0')
    const s = String(secs % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div style={styles.page}>
      {/* Background gradient orb */}
      <div style={styles.orb} />

      <div style={styles.hero}>
        {/* Company logo placeholder */}
        <div style={styles.logoPlaceholder}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="1.5" />
            <path d="M8 12s1.5-3 4-3 4 3 4 3-1.5 3-4 3-4-3-4-3z" fill="var(--accent)" opacity="0.8" />
            <circle cx="12" cy="12" r="1.5" fill="#0F1115" />
          </svg>
          <span style={styles.logoText}>VoicePulse</span>
        </div>

        {/* Card */}
        <div style={styles.card}>
          {callState === 'ended' ? (
            <ThankYouState />
          ) : (
            <>
              <div style={styles.cardHeader}>
                <h1 style={styles.title}>Share your feedback</h1>
                <p style={styles.subtitle}>
                  We value your experience. Tap the button below to start a short voice survey.
                  Our AI will listen and summarise your feedback — it only takes 2 minutes.
                </p>
              </div>

              <hr style={styles.divider} />

              {/* Waveform / status */}
              <div style={styles.waveArea}>
                {callState === 'idle' && (
                  <div style={styles.micIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                      <path d="M19 10v2a7 7 0 01-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </div>
                )}
                {callState === 'connecting' && (
                  <div style={styles.connecting}>
                    <div style={styles.spinner} />
                    <p style={styles.statusText}>Connecting…</p>
                  </div>
                )}
                {callState === 'active' && (
                  <div style={styles.activeArea}>
                    <WaveformAnimation active />
                    <p style={styles.statusText}>
                      <span style={styles.liveDot} />
                      Live · {formatDuration(duration)}
                    </p>
                  </div>
                )}
              </div>

              {/* CTA */}
              {callState === 'idle' && (
                <button className="btn-primary" style={styles.cta} onClick={startCall}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                    <path d="M19 10v2a7 7 0 01-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                  </svg>
                  Start Voice Survey
                </button>
              )}
              {callState === 'connecting' && (
                <button className="btn-primary" style={{ ...styles.cta, opacity: 0.5 }} disabled>
                  Connecting…
                </button>
              )}
              {callState === 'active' && (
                <button
                  style={styles.endBtn}
                  onClick={endCall}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  End Call
                </button>
              )}

              <p style={styles.hint}>
                {callState === 'idle'
                  ? 'Your browser will ask for microphone permission.'
                  : callState === 'active'
                  ? 'Speak naturally — our AI is listening.'
                  : ''}
              </p>

              {!VAPI_API_KEY && callState === 'idle' && (
                <div style={styles.demoBanner}>
                  Demo mode — add VITE_VAPI_API_KEY to enable live calls
                </div>
              )}
            </>
          )}
        </div>

        <p style={styles.footer}>
          Survey ID: <code style={styles.code}>{id}</code>
        </p>
      </div>

      <style>{spinnerCSS}</style>
    </div>
  )
}

function ThankYouState() {
  return (
    <div style={styles.thankYou}>
      <div style={styles.checkCircle}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 style={styles.tyTitle}>Thank you!</h2>
      <p style={styles.tyText}>
        Your feedback has been recorded and will help us improve. We appreciate you taking the time.
      </p>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-base)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    position: 'relative',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    top: '10%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 600,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(ellipse, rgba(45,212,191,0.07) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
    width: '100%',
    maxWidth: 480,
    position: 'relative',
    zIndex: 1,
  },
  logoPlaceholder: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  card: {
    width: '100%',
    background: 'rgba(22, 25, 31, 0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(45,212,191,0.15)',
    boxShadow: '0 0 0 1px rgba(45,212,191,0.08), 0 24px 64px rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: '36px 32px',
  },
  cardHeader: {
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.03em',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.65,
    maxWidth: 360,
    margin: '0 auto',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid var(--border-subtle)',
    margin: '0 0 24px',
  },
  waveArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    marginBottom: 24,
  },
  micIcon: {
    opacity: 0.6,
  },
  connecting: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  activeArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    display: 'inline-block',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#F87171',
    boxShadow: '0 0 6px #F87171',
    animation: 'pulse 1.5s infinite',
  },
  cta: {
    width: '100%',
    padding: '14px 24px',
    fontSize: '1rem',
  },
  endBtn: {
    width: '100%',
    padding: '13px 24px',
    fontSize: '0.95rem',
    fontWeight: 600,
    background: 'rgba(248,113,113,0.12)',
    color: '#F87171',
    border: '1px solid rgba(248,113,113,0.25)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background 0.15s ease',
    cursor: 'pointer',
  },
  hint: {
    marginTop: 12,
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    minHeight: 18,
  },
  demoBanner: {
    marginTop: 16,
    padding: '8px 14px',
    background: 'rgba(251,191,36,0.08)',
    border: '1px solid rgba(251,191,36,0.2)',
    borderRadius: 8,
    fontSize: '0.78rem',
    color: '#FBBF24',
    textAlign: 'center',
  },
  footer: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
  },
  code: {
    fontFamily: 'monospace',
    color: 'var(--text-primary)',
    fontSize: '0.75rem',
  },
  // Thank you state
  thankYou: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    padding: '16px 0',
    textAlign: 'center',
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'rgba(45,212,191,0.12)',
    border: '1px solid rgba(45,212,191,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tyTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  tyText: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.65,
    maxWidth: 320,
  },
  spinner: {
    width: 28,
    height: 28,
    border: '2px solid var(--border-subtle)',
    borderTop: '2px solid var(--accent)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}

const spinnerCSS = `
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`
