import { useState, useEffect, useRef } from 'react'
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import ThemePills from '../components/ThemePills'
import RespondentDrawer from '../components/RespondentDrawer'
import { MOCK_SURVEYS, MOCK_CONTACTS, MOCK_SURVEY_ANALYTICS } from '../mockData'
import { useMode } from '../context/ModeContext'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

// ─── Survey type definitions ──────────────────────────────────────────────────

const SURVEY_TYPES = [
  { id: 'csat',     name: 'CSAT',              desc: 'Customer satisfaction score',    scored: true,  scale: '1 – 5'  },
  { id: 'nps',      name: 'NPS',               desc: 'Net Promoter Score',             scored: true,  scale: '0 – 10' },
  { id: 'enps',     name: 'eNPS',              desc: 'Employee Net Promoter Score',    scored: true,  scale: '0 – 10' },
  { id: 'star',     name: 'Star Rating',       desc: 'Simple star-based rating',       scored: true,  scale: '1 – 5'  },
  { id: 'product',  name: 'Product Feedback',  desc: 'Qualitative product insights',   scored: false              },
  { id: 'personal', name: 'Personal / Peer',   desc: '360° personal feedback',         scored: false              },
  { id: 'event',    name: 'Event Feedback',    desc: 'Post-event experience survey',   scored: false              },
  { id: 'research', name: 'Research Interview',desc: 'Open-ended discovery session',   scored: false              },
]

const DEFAULT_QUESTIONS = {
  csat:     ['How satisfied are you with your overall experience?', 'What did we do particularly well?', 'What could we improve?'],
  nps:      ['How likely are you to recommend us to a friend or colleague?', 'What is the main reason for your score?', 'What would make you even more likely to recommend us?'],
  enps:     ['How likely are you to recommend this company as a great place to work?', 'What makes this a great place to work?', 'What would make this an even better workplace?'],
  star:     ['How would you rate your overall experience?', 'What stood out most to you?', 'Is there anything we could have done better?'],
  product:  ['What problem were you trying to solve?', 'What worked well for you?', 'What frustrated you or slowed you down?', 'What one feature would make the biggest difference?'],
  personal: ['What are their key strengths?', 'What should they focus on developing?', 'How do they impact the team around them?'],
  event:    ['How was the overall event experience?', 'Which sessions or moments were most valuable?', 'What could be improved for next time?'],
  research: ['Can you walk me through your current process?', 'What challenges do you face in this area?', 'How are you currently solving this problem?', 'What would an ideal solution look like?'],
}

const AUDIENCES = ['Customers', 'Employees', 'Event Attendees', 'General Public']
const TONES     = ['Formal', 'Casual', 'Empathetic']

const EMPTY_FORM = {
  title: '',
  survey_type: null,
  intent: '',
  audience: 'Customers',
  tone: 'Empathetic',
  scoring_enabled: false,
  questions: [],
}

const STATUS_META = {
  invited:   { label: 'Invited',   color: 'var(--text-secondary)', bg: 'var(--bg-control)' },
  started:   { label: 'Started',   color: '#FBBF24',                bg: 'rgba(251,191,36,0.1)' },
  completed: { label: 'Completed', color: 'var(--accent)',          bg: 'rgba(45,212,191,0.1)' },
  bounced:   { label: 'Bounced',   color: '#F87171',                bg: 'rgba(248,113,113,0.1)' },
}

const PIE_COLORS = {
  positive: '#2DD4BF',
  neutral:  '#8B909A',
  negative: '#F87171',
}

const WORD_COLORS = ['#2DD4BF', '#7C9CFF', '#F9A870', '#A78BFA', '#6EE7B7', '#FCA5A5']

// ─── Main component ───────────────────────────────────────────────────────────

export default function Admin() {
  const [surveys, setSurveys] = useState([])
  const [selectedSurvey, setSelectedSurvey] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const { mode } = useMode()

  useEffect(() => {
    if (mode === 'test') { setSurveys(MOCK_SURVEYS); return }
    fetch(`${API}/surveys`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => setSurveys(Array.isArray(data) && data.length ? data : []))
      .catch(() => setSurveys([]))
  }, [mode])

  function handleCreated(survey) {
    setSurveys((prev) => [{ ...survey, response_count: 0 }, ...prev])
    setModalOpen(false)
  }

  if (selectedSurvey) {
    return <SurveyDetail survey={selectedSurvey} onBack={() => setSelectedSurvey(null)} />
  }

  const totalSurveys = surveys.length
  const activeSurveys = surveys.filter((s) => s.status === 'active').length
  const completedSurveys = surveys.filter((s) => s.status === 'completed').length

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Surveys</h1>
          <p style={styles.pageSubtitle}>Create and manage your voice feedback surveys</p>
        </div>
        <button className="btn-primary" style={styles.createBtn} onClick={() => setModalOpen(true)}>
          + Create Survey
        </button>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Surveys', value: totalSurveys },
          { label: 'Active',        value: activeSurveys,   accent: true },
          { label: 'Completed',     value: completedSurveys },
        ].map(({ label, value, accent }) => (
          <div key={label} style={styles.statCard}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={styles.panel}>
        <p style={styles.panelTitle}>
          All Surveys
          <span style={styles.badge}>{surveys.length}</span>
        </p>
        {surveys.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No surveys yet. Create your first survey above.</p>
        ) : (
          <div style={styles.surveyList}>
            {surveys.map((s) => (
              <SurveyRow key={s.uuid} survey={s} onClick={() => setSelectedSurvey(s)} />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <SurveyWizardModal onClose={() => setModalOpen(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}

// ─── Survey detail (drill-down) ───────────────────────────────────────────────

function SurveyDetail({ survey, onBack }) {
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [addContactsOpen, setAddContactsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('analytics')
  const [drawerContact, setDrawerContact] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const { mode } = useMode()

  useEffect(() => {
    setContacts([])
    setAnalytics(null)
    setContactsLoading(true)

    if (mode === 'test') {
      setContacts(MOCK_CONTACTS)
      setContactsLoading(false)
      setAnalytics(MOCK_SURVEY_ANALYTICS)
      return
    }

    fetch(`${API}/surveys/${survey.uuid}/contacts`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => setContacts(Array.isArray(data) ? data : []))
      .catch(() => setContacts([]))
      .finally(() => setContactsLoading(false))

    fetch(`${API}/analytics/survey/${survey.uuid}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => setAnalytics(data))
      .catch(() => setAnalytics(null))
  }, [survey.uuid, mode])

  function handleContactsAdded(newContacts) {
    setContacts((prev) => [...newContacts, ...prev])
    setAddContactsOpen(false)
  }

  async function updateStatus(contactId, status) {
    if (mode === 'test') {
      await new Promise((r) => setTimeout(r, 600))
      setContacts((prev) => prev.map((c) =>
        c.id === contactId
          ? { ...c, status, completed_at: status === 'completed' ? new Date().toISOString() : c.completed_at }
          : c
      ))
      return
    }
    try {
      const res = await fetch(`${API}/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setContacts((prev) => prev.map((c) => (c.id === contactId ? updated : c)))
    } catch {
      setContacts((prev) => prev.map((c) =>
        c.id === contactId
          ? { ...c, status, completed_at: status === 'completed' ? new Date().toISOString() : c.completed_at }
          : c
      ))
    }
  }

  function copyLink(e, contact) {
    e.stopPropagation()
    navigator.clipboard.writeText(`${window.location.origin}${contact.survey_link}`).catch(() => {})
    setCopiedId(contact.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const typeDef = SURVEY_TYPES.find((t) => t.id === survey.survey_type)
  const isScored = typeDef?.scored ?? false
  const counts = contacts.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc }, {})
  const responseRate = contacts.length ? Math.round(((counts.completed || 0) / contacts.length) * 100) : 0

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const pieData = analytics
    ? [
        { name: 'Positive', value: analytics.sentiment_breakdown?.positive || 0, color: PIE_COLORS.positive },
        { name: 'Neutral',  value: analytics.sentiment_breakdown?.neutral  || 0, color: PIE_COLORS.neutral  },
        { name: 'Negative', value: analytics.sentiment_breakdown?.negative || 0, color: PIE_COLORS.negative },
      ].filter((d) => d.value > 0)
    : []

  return (
    <div style={styles.page}>
      {/* Breadcrumb */}
      <button onClick={onBack} style={styles.backLink}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Surveys
      </button>

      {/* Header */}
      <div style={styles.detailHeaderRow}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <h1 style={styles.pageTitle}>{survey.title}</h1>
            {typeDef && (
              <span style={{ ...styles.tag, color: 'var(--accent)', background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)' }}>
                {typeDef.name}
              </span>
            )}
            <span style={{ ...styles.statusBadge, background: 'rgba(45,212,191,0.1)', color: 'var(--accent)' }}>
              {survey.status}
            </span>
          </div>
          <p style={{ ...styles.pageSubtitle, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0 }}>
            {survey.audience && <span>{survey.audience}</span>}
            {survey.audience && survey.tone && <span style={{ margin: '0 6px', color: 'var(--border-subtle)' }}>·</span>}
            {survey.tone && <span>{survey.tone}</span>}
            {survey.created_at && (
              <>
                <span style={{ margin: '0 6px', color: 'var(--border-subtle)' }}>·</span>
                <span>Created {formatDate(survey.created_at)}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        {[['analytics', 'Analytics'], ['audience', 'Audience']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              ...styles.tabBtn,
              color: activeTab === key ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === key ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {label}
            {key === 'audience' && contacts.length > 0 && (
              <span style={{ ...styles.badge, marginLeft: 6 }}>{contacts.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Analytics tab ── */}
      {activeTab === 'analytics' && (
        <>
          {/* Stats bar */}
          <div style={styles.statsRow}>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <div key={key} style={styles.statCard}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: meta.color }}>{counts[key] || 0}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{meta.label}</div>
              </div>
            ))}
            <div style={{ ...styles.statCard, borderColor: 'rgba(45,212,191,0.25)' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)' }}>{responseRate}%</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>Response Rate</div>
            </div>
          </div>

          {analytics ? (
            <>
              {/* Avg score */}
              {isScored && analytics.avg_score != null && (
                <div style={{ ...styles.chartCard, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Avg Score</div>
                    <div style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{analytics.avg_score}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      {typeDef?.scale} scale · {analytics.total_responses} {analytics.total_responses === 1 ? 'response' : 'responses'}
                    </div>
                  </div>
                </div>
              )}

              {/* Sentiment + Word Cloud */}
              <div style={styles.chartsRow}>
                <div style={{ ...styles.chartCard, flex: 1, minWidth: 200 }}>
                  <p style={styles.chartTitle}>Sentiment</p>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="45%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="transparent" />
                          ))}
                        </Pie>
                        <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{v}</span>} />
                        <Tooltip formatter={(value, name) => [value, name]} contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', paddingTop: 8 }}>No sentiment data yet.</p>
                  )}
                </div>

                <div style={{ ...styles.chartCard, flex: 2, minWidth: 0 }}>
                  <p style={styles.chartTitle}>
                    Word Cloud <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>— aggregated across all responses</span>
                  </p>
                  <div style={{ minHeight: 180, display: 'flex', alignItems: 'center' }}>
                    <WordCloud wordFrequencies={analytics.word_frequencies} />
                  </div>
                </div>
              </div>

              {/* Top Themes */}
              <div style={{ ...styles.chartCard, marginBottom: 16 }}>
                <p style={styles.chartTitle}>Top Themes</p>
                <ThemePills themes={analytics.top_themes || []} />
              </div>

              {/* Response Volume */}
              {analytics.daily_volumes?.length > 0 && (
                <div style={{ ...styles.chartCard, marginBottom: 16 }}>
                  <p style={styles.chartTitle}>
                    Response Volume <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>— last 30 days</span>
                  </p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={analytics.daily_volumes} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
                      <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        formatter={(v) => [v, 'Responses']}
                        contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: '0.85rem' }}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      />
                      <Bar dataKey="count" fill="var(--accent)" opacity={0.8} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent Responses */}
              {analytics.recent_responses?.length > 0 && (
                <div style={{ ...styles.chartCard, marginBottom: 16 }}>
                  <p style={styles.chartTitle}>Recent Responses</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
                    {analytics.recent_responses.map((r, i) => {
                      const sentMeta = { positive: { color: 'var(--accent)', bg: 'rgba(45,212,191,0.1)' }, neutral: { color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' }, negative: { color: '#F87171', bg: 'rgba(248,113,113,0.1)' } }[r.sentiment] || { color: 'var(--text-secondary)', bg: 'var(--bg-control)' }
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)' }}>
                          <span style={{ flex: 2, fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                          {r.score != null && (
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{r.score}</span>
                          )}
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 9px', borderRadius: 10, background: sentMeta.bg, color: sentMeta.color, textTransform: 'capitalize', flexShrink: 0 }}>{r.sentiment}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 'auto' }}>
                            {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', padding: '8px 0' }}>Loading analytics…</p>
          )}
        </>
      )}

      {/* ── Audience tab ── */}
      {activeTab === 'audience' && (
        <div style={styles.panel}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <p style={{ ...styles.panelTitle, marginBottom: 0 }}>
              Respondents
              <span style={styles.badge}>{contacts.length}</span>
            </p>
            <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => setAddContactsOpen(true)}>
              + Add Contacts
            </button>
          </div>

          {contactsLoading ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Loading…</p>
          ) : contacts.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              No contacts yet.{' '}
              <button onClick={() => setAddContactsOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.88rem', padding: 0 }}>
                Add contacts
              </button>{' '}
              to start collecting responses.
            </p>
          ) : (
            <div style={styles.table}>
              <div style={styles.tableHeader}>
                <span style={{ flex: 2 }}>Name</span>
                <span style={{ flex: 2.5 }}>Email</span>
                <span style={{ flex: 1.2 }}>Status</span>
                <span style={{ flex: 1.5 }}>Completed</span>
                <span style={{ flex: 1.5, textAlign: 'right' }}>Actions</span>
              </div>
              {contacts.map((c) => (
                <ContactRow
                  key={c.id}
                  contact={c}
                  copied={copiedId === c.id}
                  onCopy={(e) => copyLink(e, c)}
                  onStatusChange={(status) => updateStatus(c.id, status)}
                  onClick={() => setDrawerContact(c)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {addContactsOpen && (
        <AddContactsModal
          surveyUuid={survey.uuid}
          onClose={() => setAddContactsOpen(false)}
          onAdded={handleContactsAdded}
        />
      )}

      {drawerContact && (
        <RespondentDrawer
          contact={drawerContact}
          isScored={isScored}
          onClose={() => setDrawerContact(null)}
        />
      )}
    </div>
  )
}

// ─── Add Contacts Modal ───────────────────────────────────────────────────────

function AddContactsModal({ surveyUuid, onClose, onAdded }) {
  const [tab, setTab] = useState('single')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const { mode } = useMode()

  async function handleAdd(e) {
    e.preventDefault()
    if (!email.trim()) { setAddError('Email is required'); return }
    setAdding(true)
    setAddError('')
    const demo = {
      id: Date.now(),
      name: name.trim() || email.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      status: 'invited',
      invited_at: new Date().toISOString(),
      completed_at: null,
      created_at: new Date().toISOString(),
      survey_link: `/survey/${surveyUuid}?c=${Date.now()}`,
    }
    if (mode === 'test') {
      await new Promise((r) => setTimeout(r, 600))
      onAdded([demo])
      setAdding(false)
      return
    }
    try {
      const res = await fetch(`${API}/surveys/${surveyUuid}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || email.trim(), email: email.trim(), phone: phone.trim() || null }),
      })
      if (!res.ok) throw new Error()
      const contact = await res.json()
      onAdded([contact])
    } catch {
      onAdded([demo])
    } finally {
      setAdding(false)
    }
  }

  async function importFile(file) {
    if (!file) return
    setImporting(true)
    setImportResult(null)
    if (mode === 'test') {
      await new Promise((r) => setTimeout(r, 600))
      setImportResult({ ok: true, imported: 3, skipped: 0 })
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API}/surveys/${surveyUuid}/contacts/import`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error()
      const result = await res.json()
      setImportResult({ ok: true, imported: result.imported, skipped: result.skipped })
      if (result.contacts?.length) onAdded(result.contacts)
    } catch {
      setImportResult({ ok: false, message: 'Import failed. Check CSV format and try again.' })
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleFileChange(e) { importFile(e.target.files?.[0]) }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    importFile(e.dataTransfer.files?.[0])
  }

  function handleOverlayClick(e) { if (e.target === e.currentTarget) onClose() }

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={{ ...styles.modal, maxWidth: 520 }}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
          Add Contacts
        </h2>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-control)', borderRadius: 8, padding: 4 }}>
          {[['single', 'Single Contact'], ['csv', 'CSV Import']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '7px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 600,
                background: tab === key ? 'var(--bg-surface)' : 'transparent',
                color: tab === key ? 'var(--text-primary)' : 'var(--text-secondary)',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'single' && (
          <form onSubmit={handleAdd}>
            <div style={{ marginBottom: 14 }}>
              <label className="label">Name</label>
              <input className="input" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="label">Email *</label>
              <input className="input" type="email" placeholder="jane@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setAddError('') }} style={addError ? { borderColor: 'rgba(248,113,113,0.5)' } : {}} />
              {addError && <p style={fieldError}>{addError}</p>}
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="label">Phone <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(optional)</span></label>
              <input className="input" placeholder="+1 555 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '11px' }} disabled={adding}>
              {adding ? 'Adding…' : 'Add Contact'}
            </button>
          </form>
        )}

        {tab === 'csv' && (
          <div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-subtle)'}`,
                borderRadius: 10, padding: '36px 24px', textAlign: 'center', cursor: 'pointer',
                background: dragOver ? 'rgba(45,212,191,0.04)' : 'var(--bg-control)',
                transition: 'border-color 0.15s ease, background 0.15s ease',
                marginBottom: 16,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 }}>
                {importing ? 'Importing…' : 'Drop CSV here or click to browse'}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Columns:{' '}
                <code style={{ background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: 4 }}>name</code>,{' '}
                <code style={{ background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: 4 }}>email</code>,{' '}
                <code style={{ background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: 4 }}>phone</code> (optional)
              </p>
              <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>

            {importResult && (
              <p style={{ fontSize: '0.85rem', color: importResult.ok ? 'var(--accent)' : '#F87171', textAlign: 'center' }}>
                {importResult.ok
                  ? `${importResult.imported} contacts imported${importResult.skipped ? `, ${importResult.skipped} skipped` : ''}`
                  : importResult.message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Contact row ──────────────────────────────────────────────────────────────

function ContactRow({ contact, copied, onCopy, onStatusChange, onClick }) {
  const meta = STATUS_META[contact.status] || STATUS_META.invited
  const [hovered, setHovered] = useState(false)
  function fmt(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  return (
    <div
      style={{ ...styles.tableRow, cursor: 'pointer', background: hovered ? 'rgba(255,255,255,0.02)' : 'var(--bg-base)', transition: 'background 0.12s ease' }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ flex: 2, fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.name}</span>
      <span style={{ flex: 2.5, fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.email}</span>
      <span style={{ flex: 1.2 }} onClick={(e) => e.stopPropagation()}>
        <select
          value={contact.status}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{ background: meta.bg, color: meta.color, border: 'none', borderRadius: 12, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
        >
          {Object.entries(STATUS_META).map(([key, m]) => (
            <option key={key} value={key}>{m.label}</option>
          ))}
        </select>
      </span>
      <span style={{ flex: 1.5, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{fmt(contact.completed_at)}</span>
      <span style={{ flex: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={onCopy}>{copied ? 'Copied!' : 'Copy Link'}</button>
      </span>
    </div>
  )
}

// ─── Word Cloud ───────────────────────────────────────────────────────────────

function WordCloud({ wordFrequencies }) {
  if (!wordFrequencies || Object.keys(wordFrequencies).length === 0) {
    return <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No word data yet.</p>
  }
  const entries = Object.entries(wordFrequencies)
  const maxWeight = Math.max(...entries.map(([, w]) => w))
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 14px', alignItems: 'center', lineHeight: 1.6 }}>
      {entries
        .sort((a, b) => b[1] - a[1])
        .map(([word, weight], i) => {
          const ratio = weight / maxWeight
          return (
            <span
              key={word}
              style={{
                fontSize: `${0.72 + ratio * 1.1}rem`,
                fontWeight: ratio > 0.6 ? 700 : 500,
                color: WORD_COLORS[i % WORD_COLORS.length],
                opacity: 0.55 + ratio * 0.45,
                letterSpacing: '-0.01em',
                cursor: 'default',
              }}
            >
              {word}
            </span>
          )
        })}
    </div>
  )
}

// ─── Wizard Modal ─────────────────────────────────────────────────────────────

function SurveyWizardModal({ onClose, onCreated }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [stepErrors, setStepErrors] = useState({})
  const [createdSurvey, setCreatedSurvey] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const { mode } = useMode()

  function selectType(typeId) {
    const t = SURVEY_TYPES.find((t) => t.id === typeId)
    setForm((f) => ({ ...f, survey_type: typeId, scoring_enabled: t.scored, questions: DEFAULT_QUESTIONS[typeId] || [] }))
    if (stepErrors.survey_type) setStepErrors((e) => ({ ...e, survey_type: undefined }))
  }

  function validateStep(s) {
    if (s === 1) {
      const errs = {}
      if (!form.title.trim()) errs.title = 'Survey name is required'
      if (!form.survey_type) errs.survey_type = 'Please select a survey type'
      return errs
    }
    if (s === 2) {
      const errs = {}
      if (!form.intent.trim()) errs.intent = 'Please describe the intent of this survey'
      return errs
    }
    return {}
  }

  function goNext() {
    const errs = validateStep(step)
    if (Object.keys(errs).length) { setStepErrors(errs); return }
    setStepErrors({})
    setStep((s) => s + 1)
  }

  function goBack() { setStepErrors({}); setStep((s) => s - 1) }

  function addQuestion() {
    if (!newQuestion.trim()) return
    setForm((f) => ({ ...f, questions: [...f.questions, newQuestion.trim()] }))
    setNewQuestion('')
  }

  function removeQuestion(i) {
    setForm((f) => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }))
  }

  async function handleSubmit() {
    setCreating(true)
    const demoId = `demo-${Date.now()}`
    const demo = { id: Date.now(), uuid: demoId, title: form.title, survey_type: form.survey_type, audience: form.audience, tone: form.tone, status: 'active', created_at: new Date().toISOString(), survey_link: `/survey/${demoId}`, response_count: 0 }
    if (mode === 'test') {
      await new Promise((r) => setTimeout(r, 600))
      setCreatedSurvey(demo)
      setStep(4)
      setCreating(false)
      return
    }
    const payload = { title: form.title, survey_type: form.survey_type, intent: form.intent, audience: form.audience, tone: form.tone, scoring_enabled: form.scoring_enabled, custom_questions: form.questions }
    try {
      const res = await fetch(`${API}/surveys`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      const created = await res.json()
      setCreatedSurvey(created)
      setStep(4)
    } catch {
      setCreatedSurvey(demo)
      setStep(4)
    } finally {
      setCreating(false)
    }
  }

  function handleOverlayClick(e) { if (e.target === e.currentTarget) onClose() }

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {step < 4 && <StepIndicator current={step} />}
        {step === 1 && <Step1Basics form={form} setForm={setForm} selectType={selectType} errors={stepErrors} />}
        {step === 2 && <Step2Context form={form} setForm={setForm} errors={stepErrors} />}
        {step === 3 && <Step3Configure form={form} setForm={setForm} newQuestion={newQuestion} setNewQuestion={setNewQuestion} addQuestion={addQuestion} removeQuestion={removeQuestion} />}
        {step === 4 && <SuccessStep survey={createdSurvey} onDone={() => onCreated(createdSurvey)} />}

        {step < 4 && (
          <div style={styles.wizardNav}>
            {step > 1 ? <button className="btn-ghost" style={styles.navBtn} onClick={goBack}>Back</button> : <div />}
            {step < 3 && <button className="btn-primary" style={styles.navBtn} onClick={goNext}>Continue</button>}
            {step === 3 && <button className="btn-primary" style={styles.navBtn} onClick={handleSubmit} disabled={creating}>{creating ? 'Creating…' : 'Create Survey'}</button>}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  const STEPS = ['Basics', 'Context', 'Configure']
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
      {STEPS.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                background: done ? 'var(--accent)' : active ? 'rgba(45,212,191,0.12)' : 'var(--bg-control)',
                border: `1px solid ${done ? 'var(--accent)' : active ? 'var(--accent)' : 'var(--border-subtle)'}`,
                color: done ? '#0F1115' : active ? 'var(--accent)' : 'var(--text-secondary)',
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', color: active ? 'var(--text-primary)' : done ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: active ? 600 : 400 }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, margin: '-14px 12px 0', background: done ? 'rgba(45,212,191,0.4)' : 'var(--border-subtle)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Basics ───────────────────────────────────────────────────────────

function Step1Basics({ form, setForm, selectType, errors }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <label className="label">Survey Name</label>
        <input className="input" placeholder="e.g. Q1 Onboarding Feedback" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={errors.title ? { borderColor: 'rgba(248,113,113,0.5)' } : {}} />
        {errors.title && <p style={fieldError}>{errors.title}</p>}
      </div>
      <div>
        <label className="label" style={{ marginBottom: 12 }}>Survey Type</label>
        <p style={sectionLabel}>Scored</p>
        <div style={typeGrid}>
          {SURVEY_TYPES.filter((t) => t.scored).map((t) => (
            <TypeCard key={t.id} type={t} selected={form.survey_type === t.id} onSelect={() => selectType(t.id)} />
          ))}
        </div>
        <p style={{ ...sectionLabel, marginTop: 16 }}>Unscored</p>
        <div style={typeGrid}>
          {SURVEY_TYPES.filter((t) => !t.scored).map((t) => (
            <TypeCard key={t.id} type={t} selected={form.survey_type === t.id} onSelect={() => selectType(t.id)} />
          ))}
        </div>
        {errors.survey_type && <p style={{ ...fieldError, marginTop: 10 }}>{errors.survey_type}</p>}
      </div>
    </div>
  )
}

function TypeCard({ type, selected, onSelect }) {
  return (
    <button onClick={onSelect} style={{ background: selected ? 'rgba(45,212,191,0.07)' : 'var(--bg-control)', border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-subtle)'}`, borderRadius: 10, padding: '14px 16px', textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.15s ease, background 0.15s ease', outline: 'none' }}>
      <div style={{ color: selected ? 'var(--accent)' : 'var(--text-secondary)', marginBottom: 8 }}><TypeIcon id={type.id} /></div>
      <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 3, color: selected ? 'var(--accent)' : 'var(--text-primary)' }}>{type.name}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{type.desc}</div>
      {type.scored && (
        <div style={{ marginTop: 8, fontSize: '0.7rem', fontWeight: 600, color: selected ? 'var(--accent)' : 'var(--text-secondary)', background: selected ? 'rgba(45,212,191,0.12)' : 'var(--bg-surface)', borderRadius: 4, padding: '2px 7px', display: 'inline-block', border: `1px solid ${selected ? 'rgba(45,212,191,0.3)' : 'var(--border-subtle)'}` }}>
          {type.scale}
        </div>
      )}
    </button>
  )
}

// ─── Step 2: Context ──────────────────────────────────────────────────────────

function Step2Context({ form, setForm, errors }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <label className="label">Survey Intent</label>
        <p style={helpText}>Describe what you want to learn. SPKLY will use this to shape the voice agent's conversation.</p>
        <textarea className="input" rows={4} placeholder="e.g. We want to understand where new users get stuck during onboarding and what would make it easier." value={form.intent} onChange={(e) => setForm((f) => ({ ...f, intent: e.target.value }))} style={{ resize: 'vertical', ...(errors.intent ? { borderColor: 'rgba(248,113,113,0.5)' } : {}) }} />
        {errors.intent && <p style={fieldError}>{errors.intent}</p>}
      </div>
      <div style={{ marginBottom: 24 }}>
        <label className="label">Audience</label>
        <PillSelector options={AUDIENCES} value={form.audience} onChange={(v) => setForm((f) => ({ ...f, audience: v }))} />
      </div>
      <div>
        <label className="label">Tone</label>
        <p style={helpText}>Sets the voice agent's communication style throughout the call.</p>
        <PillSelector options={TONES} value={form.tone} onChange={(v) => setForm((f) => ({ ...f, tone: v }))} />
      </div>
    </div>
  )
}

// ─── Step 3: Configure ────────────────────────────────────────────────────────

function Step3Configure({ form, setForm, newQuestion, setNewQuestion, addQuestion, removeQuestion }) {
  const selectedType = SURVEY_TYPES.find((t) => t.id === form.survey_type)
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <label className="label">Scoring</label>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-control)', borderRadius: 10, border: '1px solid var(--border-subtle)', padding: '14px 16px' }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
              {form.scoring_enabled ? `Enabled — ${selectedType?.scale || ''} scale` : 'Disabled — qualitative only'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {selectedType?.scored ? 'Auto-enabled for this type. Can be turned off.' : 'This survey type is unscored by default.'}
            </div>
          </div>
          <Toggle value={form.scoring_enabled} onChange={(v) => setForm((f) => ({ ...f, scoring_enabled: v }))} />
        </div>
      </div>
      <div>
        <label className="label">Questions</label>
        <p style={helpText}>These guide the voice agent. Pre-filled based on survey type — remove or add as needed.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {form.questions.map((q, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--bg-control)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingTop: 2, minWidth: 18, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{q}</span>
              <button onClick={() => removeQuestion(i)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 4px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ))}
          {form.questions.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '8px 0' }}>No questions yet — add some below.</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="Add a custom question…" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addQuestion()} style={{ flex: 1 }} />
          <button className="btn-ghost" onClick={addQuestion} style={{ padding: '10px 16px', flexShrink: 0 }}>+ Add</button>
        </div>
      </div>
    </div>
  )
}

// ─── Success step ─────────────────────────────────────────────────────────────

function SuccessStep({ survey, onDone }) {
  const [copied, setCopied] = useState(false)
  const link = survey ? `${window.location.origin}${survey.survey_link}` : ''
  function copy() { navigator.clipboard.writeText(link).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', margin: '0 auto 16px', background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      </div>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Survey created</h2>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 24 }}>Share this link with your respondents to start collecting voice feedback.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-control)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-subtle)', marginBottom: 20, textAlign: 'left' }}>
        <code style={{ flex: 1, fontSize: '0.78rem', color: 'var(--text-primary)', fontFamily: 'monospace', wordBreak: 'break-all', minWidth: 0 }}>{link}</code>
        <button className="btn-ghost" style={{ padding: '5px 14px', fontSize: '0.8rem', flexShrink: 0 }} onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
      </div>
      <button className="btn-primary" style={{ width: '100%', padding: '11px' }} onClick={onDone}>Done</button>
    </div>
  )
}

// ─── Survey row ───────────────────────────────────────────────────────────────

function SurveyRow({ survey, onClick }) {
  const typeDef = SURVEY_TYPES.find((t) => t.id === survey.survey_type)
  const [hovered, setHovered] = useState(false)

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function copyLink(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(`${window.location.origin}${survey.survey_link}`).catch(() => {})
  }

  return (
    <div
      style={{ ...styles.surveyRow, background: hovered ? 'var(--bg-surface)' : 'var(--bg-base)', cursor: 'pointer', transition: 'background 0.15s ease' }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.surveyInfo}>
        <div style={styles.surveyName}>
          {survey.title || survey.client_name}
          {typeDef && <span style={{ ...styles.tag, color: 'var(--accent)', background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)' }}>{typeDef.name}</span>}
          {survey.audience && <span style={styles.tag}>{survey.audience}</span>}
        </div>
        <div style={styles.surveyMeta}>
          {survey.tone && <span>{survey.tone}</span>}
          {survey.tone && <span style={styles.dot}>·</span>}
          <span>Created {formatDate(survey.created_at)}</span>
          <span style={styles.dot}>·</span>
          <span>{survey.response_count ?? 0} responses</span>
        </div>
      </div>
      <div style={styles.surveyActions}>
        <span style={{ ...styles.statusBadge, background: survey.status === 'active' ? 'rgba(45,212,191,0.1)' : 'rgba(139,144,154,0.1)', color: survey.status === 'active' ? 'var(--accent)' : 'var(--text-secondary)' }}>
          {survey.status}
        </span>
        <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: '0.78rem' }} onClick={copyLink}>Copy Link</button>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function PillSelector({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((opt) => (
        <button key={opt} onClick={() => onChange(opt)} style={{ padding: '7px 18px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', border: `1px solid ${value === opt ? 'var(--accent)' : 'var(--border-subtle)'}`, background: value === opt ? 'rgba(45,212,191,0.1)' : 'var(--bg-control)', color: value === opt ? 'var(--accent)' : 'var(--text-secondary)', transition: 'all 0.15s ease' }}>
          {opt}
        </button>
      ))}
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, position: 'relative', background: value ? 'var(--accent)' : 'var(--bg-surface)', border: `1px solid ${value ? 'var(--accent)' : 'var(--border-subtle)'}`, cursor: 'pointer', transition: 'background 0.2s ease', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 2, left: value ? 21 : 2, width: 18, height: 18, borderRadius: '50%', background: value ? '#0F1115' : 'var(--text-secondary)', transition: 'left 0.2s ease' }} />
    </button>
  )
}

function TypeIcon({ id }) {
  const props = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round', strokeLinejoin: 'round' }
  const icons = {
    csat: <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
    nps: <svg {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    enps: <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    star: <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    product: <svg {...props}><line x1="12" y1="2" x2="12" y2="6"/><path d="M12 6a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3.5 5.5V19a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-1.5C7.5 16.5 6 14.5 6 12a6 6 0 0 1 6-6z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>,
    personal: <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    event: <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    research: <svg {...props}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  }
  return icons[id] || null
}

// ─── Shared style tokens ──────────────────────────────────────────────────────

const fieldError   = { fontSize: '0.78rem', color: '#F87171', marginTop: 4 }
const helpText     = { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }
const sectionLabel = { fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }
const typeGrid     = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }
const tooltipStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 14px', fontSize: '0.85rem' }

const styles = {
  page: { padding: '36px 40px', width: '100%', boxSizing: 'border-box' },
  pageHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 },
  pageTitle: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 },
  pageSubtitle: { fontSize: '0.88rem', color: 'var(--text-secondary)' },
  createBtn: { padding: '10px 20px', fontSize: '0.88rem', flexShrink: 0 },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, padding: '0 0 20px', transition: 'color 0.15s ease' },
  detailHeaderRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 16 },
  tabBar: { display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)', marginBottom: 24 },
  tabBtn: { background: 'none', border: 'none', borderBottom: '2px solid transparent', padding: '10px 20px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.15s ease, border-color 0.15s ease', marginBottom: -1 },
  statsRow: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  statCard: { flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '14px 20px', minWidth: 100 },
  chartsRow: { display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' },
  chartCard: { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)', borderRadius: 'var(--radius)', padding: '20px 24px', minWidth: 0 },
  chartTitle: { fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 },
  panel: { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: 16 },
  panelTitle: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 },
  badge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-control)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, borderRadius: 20, padding: '1px 8px', minWidth: 24 },
  table: { border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' },
  tableHeader: { display: 'flex', gap: 12, padding: '10px 16px', background: 'var(--bg-control)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)' },
  tableRow: { display: 'flex', gap: 12, padding: '12px 16px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' },
  surveyList: { display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-subtle)' },
  surveyRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' },
  surveyInfo: { flex: 1, minWidth: 0 },
  surveyName: { fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  tag: { fontSize: '0.72rem', fontWeight: 500, background: 'var(--bg-control)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 5, padding: '1px 7px' },
  surveyMeta: { fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  dot: { color: 'var(--border-subtle)' },
  surveyActions: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  statusBadge: { fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize' },
  overlay: { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  modal: { position: 'relative', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', borderRadius: 'var(--radius)', padding: '32px', width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' },
  closeBtn: { position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 6 },
  wizardNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border-subtle)' },
  navBtn: { padding: '10px 24px', minWidth: 100 },
}
