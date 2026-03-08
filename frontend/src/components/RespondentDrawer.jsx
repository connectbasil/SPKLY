import { useState, useEffect, useRef } from 'react'
import { MOCK_CONTACT_DETAIL } from '../mockData'
import { useMode } from '../context/ModeContext'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

const STATUS_META = {
  invited:   { label: 'Invited',   color: 'var(--text-secondary)', bg: 'var(--bg-control)' },
  started:   { label: 'Started',   color: '#FBBF24',                bg: 'rgba(251,191,36,0.1)' },
  completed: { label: 'Completed', color: 'var(--accent)',          bg: 'rgba(45,212,191,0.1)' },
  bounced:   { label: 'Bounced',   color: '#F87171',                bg: 'rgba(248,113,113,0.1)' },
}

const TIMELINE_ICONS = {
  invited:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  started:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  completed: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  recorded:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  bounced:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  email:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
}

const SENTIMENT_STYLE = {
  positive: { color: 'var(--accent)',  bg: 'rgba(45,212,191,0.1)',  label: 'Positive' },
  neutral:  { color: '#FBBF24',        bg: 'rgba(251,191,36,0.1)',  label: 'Neutral'  },
  negative: { color: '#F87171',        bg: 'rgba(248,113,113,0.1)', label: 'Negative' },
}

function AudioPlayer({ src }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  function togglePlay() {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause() } else { a.play() }
  }

  function onTimeUpdate() {
    setCurrentTime(audioRef.current?.currentTime || 0)
  }

  function onLoadedMetadata() {
    setDuration(audioRef.current?.duration || 0)
  }

  function onEnded() {
    setPlaying(false)
    setCurrentTime(0)
  }

  function onScrub(e) {
    const a = audioRef.current
    if (!a || !duration) return
    const val = parseFloat(e.target.value)
    a.currentTime = val
    setCurrentTime(val)
  }

  function fmt(secs) {
    if (!secs || isNaN(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div style={ap.wrap}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
        preload="metadata"
      />
      <button onClick={togglePlay} style={ap.playBtn} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>
      <span style={ap.time}>{fmt(currentTime)}</span>
      <div style={ap.scrubberWrap}>
        <div style={{ ...ap.scrubberTrack }}>
          <div style={{ ...ap.scrubberFill, width: `${progress}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={onScrub}
          style={ap.scrubberInput}
        />
      </div>
      <span style={ap.time}>{fmt(duration)}</span>
      <style>{audioPlayerCSS}</style>
    </div>
  )
}

const ap = {
  wrap: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--bg-control)', border: '1px solid var(--border-subtle)',
    borderRadius: 10, padding: '10px 14px', marginBottom: 16,
  },
  playBtn: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'var(--accent)', border: 'none',
    color: '#0F1115', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  time: { fontSize: '0.75rem', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', flexShrink: 0, minWidth: 32 },
  scrubberWrap: { flex: 1, position: 'relative', height: 20, display: 'flex', alignItems: 'center' },
  scrubberTrack: { position: 'absolute', inset: '50% 0', transform: 'translateY(-50%)', height: 3, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' },
  scrubberFill: { height: '100%', background: 'var(--accent)', borderRadius: 2 },
  scrubberInput: { position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', margin: 0 },
}

const audioPlayerCSS = `
  input[type=range].audio-scrubber { -webkit-appearance: none; width: 100%; }
`

function parseTranscript(raw) {
  if (!raw) return []
  return raw.split('\n').filter(Boolean).map((line) => {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) return { role: 'unknown', content: line }
    return {
      role: line.slice(0, colonIdx).trim().toLowerCase(),
      content: line.slice(colonIdx + 1).trim(),
    }
  })
}

export default function RespondentDrawer({ contact, isScored, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [transcriptExpanded, setTranscriptExpanded] = useState(false)
  const [visible, setVisible] = useState(false)
  const { mode } = useMode()

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    setLoading(true)
    if (mode === 'test') {
      setDetail({ ...MOCK_CONTACT_DETAIL, ...contact })
      setLoading(false)
      return
    }
    fetch(`${API}/contacts/${contact.id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => setDetail(data))
      .catch(() => setDetail({ ...MOCK_CONTACT_DETAIL, ...contact }))
      .finally(() => setLoading(false))
  }, [contact.id, mode])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 260)
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) handleClose()
  }

  function fmtTs(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const statusMeta = STATUS_META[contact.status] || STATUS_META.invited
  const transcript = detail?.response?.transcript ? parseTranscript(detail.response.transcript) : []
  const visibleTranscript = transcriptExpanded ? transcript : transcript.slice(-6)
  const hasMoreTranscript = !transcriptExpanded && transcript.length > 6

  return (
    <>
      <style>{drawerCSS}</style>
      {/* Dim overlay */}
      <div
        className={`drawer-overlay${visible ? ' drawer-overlay--visible' : ''}`}
        onClick={handleOverlayClick}
      />
      {/* Drawer panel */}
      <div className={`drawer-panel${visible ? ' drawer-panel--visible' : ''}`}>
        {/* Header */}
        <div style={s.drawerHeader}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {contact.name}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {contact.email}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ ...s.statusBadge, background: statusMeta.bg, color: statusMeta.color }}>
              {statusMeta.label}
            </span>
            <button style={s.closeBtn} onClick={handleClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div style={s.drawerBody}>
          {loading ? (
            <div style={{ padding: '24px 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Loading…</div>
          ) : (
            <>
              {/* Timeline */}
              <Section title="Activity">
                {detail?.timeline?.length > 0 ? (
                  <div style={s.timeline}>
                    {detail.timeline.map((event, i) => (
                      <div key={i} style={s.timelineItem}>
                        <div style={{
                          ...s.timelineIcon,
                          color: event.event === 'completed' ? 'var(--accent)'
                            : event.event === 'bounced' ? '#F87171'
                            : 'var(--text-secondary)',
                          background: event.event === 'completed' ? 'rgba(45,212,191,0.1)'
                            : event.event === 'bounced' ? 'rgba(248,113,113,0.1)'
                            : 'var(--bg-control)',
                        }}>
                          {TIMELINE_ICONS[event.event] || TIMELINE_ICONS.recorded}
                        </div>
                        {i < detail.timeline.length - 1 && <div style={s.timelineLine} />}
                        <div style={s.timelineContent}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {event.label}
                          </span>
                          {event.ts && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 8 }}>
                              {fmtTs(event.ts)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No activity yet.</p>
                )}
              </Section>

              {/* Response details */}
              {detail?.response && (
                <>
                  <div style={s.divider} />

                  <Section title="Response">
                    {/* Score + Sentiment */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                      {isScored && detail.response.score != null && (
                        <div style={s.metaChip}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>Score</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>
                            {detail.response.score}
                          </span>
                        </div>
                      )}
                      {detail.response.sentiment && (() => {
                        const sent = SENTIMENT_STYLE[detail.response.sentiment] || SENTIMENT_STYLE.neutral
                        return (
                          <div style={s.metaChip}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>Sentiment</span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: sent.color, background: sent.bg, borderRadius: 10, padding: '2px 9px' }}>
                              {sent.label}
                            </span>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Summary */}
                    {detail.response.summary && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                        {detail.response.summary}
                      </p>
                    )}

                    {/* Themes */}
                    {detail.response.themes?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                        {detail.response.themes.map((t) => (
                          <span key={t} style={s.themeTag}>{t}</span>
                        ))}
                      </div>
                    )}

                    {/* Key insights */}
                    {detail.response.key_insights?.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Key Insights</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {detail.response.key_insights.map((insight, i) => (
                            <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>›</span>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Section>

                  {/* Recording */}
                  <div style={s.divider} />
                  <Section title="Recording">
                    {detail.response.recording_url ? (
                      <AudioPlayer src={detail.response.recording_url} />
                    ) : (
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        No recording available
                      </p>
                    )}
                  </Section>

                  {/* Transcript */}
                  {transcript.length > 0 && (
                    <>
                      <div style={s.divider} />
                      <Section title="Transcript">
                        <div style={s.transcriptWrap}>
                          {visibleTranscript.map((line, i) => (
                            <div key={i} style={{ marginBottom: 10 }}>
                              <span style={{
                                fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                                color: line.role === 'assistant' ? 'var(--accent)' : 'var(--text-secondary)',
                                display: 'block', marginBottom: 3,
                              }}>
                                {line.role === 'assistant' ? 'Agent' : 'Respondent'}
                              </span>
                              <span style={{ fontSize: '0.83rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                                {line.content}
                              </span>
                            </div>
                          ))}
                        </div>
                        {hasMoreTranscript && (
                          <button
                            onClick={() => setTranscriptExpanded(true)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.82rem', cursor: 'pointer', padding: '6px 0', fontWeight: 500 }}
                          >
                            Show full transcript ({transcript.length} lines)
                          </button>
                        )}
                        {transcriptExpanded && transcript.length > 6 && (
                          <button
                            onClick={() => setTranscriptExpanded(false)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.82rem', cursor: 'pointer', padding: '6px 0' }}
                          >
                            Collapse
                          </button>
                        )}
                      </Section>
                    </>
                  )}
                </>
              )}

              {/* No response yet */}
              {!detail?.response && contact.status !== 'bounced' && (
                <>
                  <div style={s.divider} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingTop: 4 }}>
                    No response recorded yet.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        {title}
      </p>
      {children}
    </div>
  )
}

const s = {
  drawerHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '20px 20px 16px', borderBottom: '1px solid var(--border-subtle)', gap: 12,
  },
  drawerBody: { padding: '20px', overflowY: 'auto', flex: 1 },
  statusBadge: { fontSize: '0.72rem', fontWeight: 600, padding: '3px 9px', borderRadius: 20, textTransform: 'capitalize' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 6 },
  timeline: { display: 'flex', flexDirection: 'column', gap: 0 },
  timelineItem: { display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative', paddingBottom: 16 },
  timelineIcon: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 },
  timelineLine: { position: 'absolute', left: 13, top: 28, width: 1, height: 'calc(100% - 14px)', background: 'var(--border-subtle)' },
  timelineContent: { paddingTop: 6 },
  divider: { height: 1, background: 'var(--border-subtle)', margin: '16px 0' },
  metaChip: { background: 'var(--bg-control)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 14px', minWidth: 70 },
  themeTag: { fontSize: '0.75rem', fontWeight: 500, color: 'var(--accent)', background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 12, padding: '3px 10px' },
  transcriptWrap: { display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--bg-control)', borderRadius: 8, padding: '12px 14px', marginBottom: 8 },
}

const drawerCSS = `
.drawer-overlay {
  position: fixed; inset: 0; z-index: 900;
  background: rgba(0,0,0,0);
  pointer-events: none;
  transition: background 0.25s ease;
}
.drawer-overlay--visible {
  background: rgba(0,0,0,0.35);
  pointer-events: auto;
}
.drawer-panel {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 901;
  width: 420px; max-width: 100vw;
  background: var(--bg-surface);
  border-left: 1px solid var(--border-subtle);
  box-shadow: -8px 0 40px rgba(0,0,0,0.4);
  display: flex; flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.25s ease;
}
.drawer-panel--visible {
  transform: translateX(0);
}
`
