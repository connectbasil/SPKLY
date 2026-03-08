import { useState, useEffect, useRef } from 'react'
import { MOCK_SURVEYS, MOCK_CONTACTS } from '../mockData'

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

const STATUS_META = {
  invited:   { label: 'Invited',   color: 'var(--text-secondary)', bg: 'var(--bg-control)' },
  started:   { label: 'Started',   color: '#FBBF24',                bg: 'rgba(251,191,36,0.1)' },
  completed: { label: 'Completed', color: 'var(--accent)',          bg: 'rgba(45,212,191,0.1)' },
  bounced:   { label: 'Bounced',   color: '#F87171',                bg: 'rgba(248,113,113,0.1)' },
}

export default function Contacts() {
  const [surveys, setSurveys] = useState([])
  const [selectedUuid, setSelectedUuid] = useState(null)
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addPhone, setAddPhone] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const fileInputRef = useRef(null)

  // Load surveys
  useEffect(() => {
    fetch(`${API}/surveys`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => {
        const list = Array.isArray(data) && data.length ? data : MOCK_SURVEYS
        setSurveys(list)
        if (list.length) setSelectedUuid(list[0].uuid)
      })
      .catch(() => {
        setSurveys(MOCK_SURVEYS)
        setSelectedUuid(MOCK_SURVEYS[0]?.uuid)
      })
  }, [])

  // Load contacts when survey changes
  useEffect(() => {
    if (!selectedUuid) return
    setLoading(true)
    setContacts([])
    setImportResult(null)
    fetch(`${API}/surveys/${selectedUuid}/contacts`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => {
        setContacts(Array.isArray(data) ? data : MOCK_CONTACTS)
      })
      .catch(() => setContacts(MOCK_CONTACTS))
      .finally(() => setLoading(false))
  }, [selectedUuid])

  async function handleAddContact(e) {
    e.preventDefault()
    if (!addEmail.trim()) { setAddError('Email is required'); return }
    setAdding(true)
    setAddError('')
    try {
      const res = await fetch(`${API}/surveys/${selectedUuid}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addName.trim() || addEmail.trim(), email: addEmail.trim(), phone: addPhone.trim() || null }),
      })
      if (!res.ok) throw new Error()
      const contact = await res.json()
      setContacts((prev) => [contact, ...prev])
    } catch {
      // Demo mode: add locally
      const demo = {
        id: Date.now(),
        name: addName.trim() || addEmail.trim(),
        email: addEmail.trim(),
        phone: addPhone.trim() || null,
        status: 'invited',
        invited_at: new Date().toISOString(),
        completed_at: null,
        created_at: new Date().toISOString(),
        survey_link: `/survey/${selectedUuid}?c=${Date.now()}`,
      }
      setContacts((prev) => [demo, ...prev])
    } finally {
      setAdding(false)
      setAddName('')
      setAddEmail('')
      setAddPhone('')
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API}/surveys/${selectedUuid}/contacts/import`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error()
      const result = await res.json()
      setImportResult({ ok: true, imported: result.imported, skipped: result.skipped })
      setContacts((prev) => [...result.contacts, ...prev])
    } catch {
      setImportResult({ ok: false, message: 'Import failed. Please check the CSV format and try again.' })
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function updateStatus(contactId, status) {
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
      // Optimistic update in demo mode
      setContacts((prev) => prev.map((c) =>
        c.id === contactId
          ? { ...c, status, completed_at: status === 'completed' ? new Date().toISOString() : c.completed_at }
          : c
      ))
    }
  }

  function copyLink(contact) {
    const url = `${window.location.origin}${contact.survey_link}`
    navigator.clipboard.writeText(url).catch(() => {})
    setCopiedId(contact.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const counts = contacts.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {})
  const responseRate = contacts.length
    ? Math.round(((counts.completed || 0) / contacts.length) * 100)
    : 0

  const selectedSurvey = surveys.find((s) => s.uuid === selectedUuid)

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Contacts</h1>
        <p style={styles.pageSubtitle}>Manage respondents and track survey completion</p>
      </div>

      {/* Survey selector */}
      <div style={styles.selectorRow}>
        <label style={styles.selectorLabel}>Survey</label>
        <select
          style={styles.select}
          value={selectedUuid || ''}
          onChange={(e) => setSelectedUuid(e.target.value)}
        >
          {surveys.map((s) => (
            <option key={s.uuid} value={s.uuid}>{s.title}</option>
          ))}
        </select>
      </div>

      {/* Stats row */}
      {contacts.length > 0 && (
        <div style={styles.statsRow}>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <div key={key} style={styles.statCard}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: meta.color }}>
                {counts[key] || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {meta.label}
              </div>
            </div>
          ))}
          <div style={{ ...styles.statCard, borderColor: 'rgba(45,212,191,0.25)' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)' }}>
              {responseRate}%
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Response Rate
            </div>
          </div>
        </div>
      )}

      {/* Add contact + CSV import */}
      <div style={styles.panel}>
        <p style={styles.panelTitle}>Add Contacts</p>

        <form onSubmit={handleAddContact} style={styles.addForm}>
          <input
            className="input"
            placeholder="Name"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            style={{ flex: 1, minWidth: 120 }}
          />
          <input
            className="input"
            placeholder="Email *"
            type="email"
            value={addEmail}
            onChange={(e) => { setAddEmail(e.target.value); setAddError('') }}
            style={{ flex: 1.5, minWidth: 180 }}
          />
          <input
            className="input"
            placeholder="Phone (optional)"
            value={addPhone}
            onChange={(e) => setAddPhone(e.target.value)}
            style={{ flex: 1, minWidth: 120 }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '10px 20px', flexShrink: 0 }}
            disabled={adding}
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </form>
        {addError && <p style={{ fontSize: '0.78rem', color: '#F87171', marginTop: 6 }}>{addError}</p>}

        <div style={styles.divider} />

        <div style={styles.csvRow}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3 }}>
              Import from CSV
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Columns: <code style={{ background: 'var(--bg-control)', padding: '1px 5px', borderRadius: 4 }}>name</code>,{' '}
              <code style={{ background: 'var(--bg-control)', padding: '1px 5px', borderRadius: 4 }}>email</code>,{' '}
              <code style={{ background: 'var(--bg-control)', padding: '1px 5px', borderRadius: 4 }}>phone</code> (optional)
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {importResult && (
              <span style={{
                fontSize: '0.8rem',
                color: importResult.ok ? 'var(--accent)' : '#F87171',
              }}>
                {importResult.ok
                  ? `${importResult.imported} imported${importResult.skipped ? `, ${importResult.skipped} skipped` : ''}`
                  : importResult.message}
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
            <button
              className="btn-ghost"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? 'Importing…' : 'Upload CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Contact list */}
      <div style={styles.panel}>
        <p style={styles.panelTitle}>
          Respondents
          <span style={styles.badge}>{contacts.length}</span>
        </p>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Loading…</p>
        ) : contacts.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            No contacts yet. Add contacts above or import a CSV.
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
                onCopy={() => copyLink(c)}
                onStatusChange={(status) => updateStatus(c.id, status)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ContactRow({ contact, copied, onCopy, onStatusChange }) {
  const meta = STATUS_META[contact.status] || STATUS_META.invited

  function fmt(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div style={styles.tableRow}>
      <span style={{ flex: 2, fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {contact.name}
      </span>
      <span style={{ flex: 2.5, fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {contact.email}
      </span>
      <span style={{ flex: 1.2 }}>
        <select
          value={contact.status}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{
            background: meta.bg,
            color: meta.color,
            border: 'none',
            borderRadius: 12,
            padding: '3px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {Object.entries(STATUS_META).map(([key, m]) => (
            <option key={key} value={key}>{m.label}</option>
          ))}
        </select>
      </span>
      <span style={{ flex: 1.5, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        {fmt(contact.completed_at)}
      </span>
      <span style={{ flex: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        <button
          className="btn-ghost"
          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          onClick={onCopy}
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </span>
    </div>
  )
}

const styles = {
  page: { padding: '36px 40px', maxWidth: 1100 },
  pageHeader: { marginBottom: 24 },
  pageTitle: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 },
  pageSubtitle: { fontSize: '0.88rem', color: 'var(--text-secondary)' },
  selectorRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  selectorLabel: { fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, flexShrink: 0 },
  select: {
    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8,
    color: 'var(--text-primary)', fontSize: '0.88rem', padding: '8px 12px', cursor: 'pointer', outline: 'none',
    minWidth: 260,
  },
  statsRow: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  statCard: {
    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
    borderRadius: 10, padding: '14px 20px', minWidth: 100,
  },
  panel: {
    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
    borderRadius: 'var(--radius)', padding: '24px', marginBottom: 16,
  },
  panelTitle: {
    fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)',
    marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8,
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-control)', color: 'var(--text-secondary)',
    fontSize: '0.75rem', fontWeight: 600, borderRadius: 20, padding: '1px 8px',
  },
  addForm: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' },
  divider: { height: 1, background: 'var(--border-subtle)', margin: '20px 0' },
  csvRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  table: { border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' },
  tableHeader: {
    display: 'flex', gap: 12, padding: '10px 16px',
    background: 'var(--bg-control)', fontSize: '0.75rem', fontWeight: 600,
    color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border-subtle)',
  },
  tableRow: {
    display: 'flex', gap: 12, padding: '12px 16px', background: 'var(--bg-base)',
    borderBottom: '1px solid var(--border-subtle)', alignItems: 'center',
  },
}
