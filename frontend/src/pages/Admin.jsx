import { useState, useEffect } from 'react'
import { MOCK_SURVEYS } from '../mockData'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {})
}

export default function Admin() {
  const [form, setForm] = useState({ client_name: '', company: '', email: '' })
  const [surveys, setSurveys] = useState([])
  const [createdSurvey, setCreatedSurvey] = useState(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetch('/api/surveys')
      .then((r) => r.json())
      .then((data) => {
        setSurveys(Array.isArray(data) && data.length ? data : MOCK_SURVEYS)
      })
      .catch(() => setSurveys(MOCK_SURVEYS))
  }, [])

  function validate() {
    const errs = {}
    if (!form.client_name.trim()) errs.client_name = 'Required'
    if (!form.company.trim()) errs.company = 'Required'
    if (!form.email.trim()) errs.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setCreating(true)

    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Server error')
      const created = await res.json()
      setCreatedSurvey(created)
      setSurveys((prev) => [created, ...prev])
      setForm({ client_name: '', company: '', email: '' })
    } catch {
      // Demo fallback
      const demo = {
        id: Date.now(),
        uuid: `demo-${Date.now()}`,
        client_name: form.client_name,
        company: form.company,
        email: form.email,
        status: 'active',
        created_at: new Date().toISOString(),
        survey_link: `/survey/demo-${Date.now()}`,
        response_count: 0,
      }
      setCreatedSurvey(demo)
      setSurveys((prev) => [demo, ...prev])
      setForm({ client_name: '', company: '', email: '' })
    } finally {
      setCreating(false)
    }
  }

  function handleCopy(link) {
    const full = `${window.location.origin}${link}`
    copyToClipboard(full)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Admin</h1>
        <p style={styles.pageSubtitle}>Create and manage survey links</p>
      </div>

      <div style={styles.layout}>
        {/* Create form */}
        <div style={styles.formPanel}>
          <p style={styles.panelTitle}>New Survey</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <Field
              label="Client Name"
              placeholder="e.g. Sarah Mitchell"
              value={form.client_name}
              onChange={(v) => handleChange('client_name', v)}
              error={errors.client_name}
            />
            <Field
              label="Company"
              placeholder="e.g. Acme Corp"
              value={form.company}
              onChange={(v) => handleChange('company', v)}
              error={errors.company}
            />
            <Field
              label="Email"
              type="email"
              placeholder="e.g. sarah@acme.com"
              value={form.email}
              onChange={(v) => handleChange('email', v)}
              error={errors.email}
            />

            <button
              type="submit"
              className="btn-primary"
              style={styles.submitBtn}
              disabled={creating}
            >
              {creating ? 'Creating…' : 'Generate Survey Link'}
            </button>
          </form>

          {/* Success state */}
          {createdSurvey && (
            <div style={styles.successBox}>
              <div style={styles.successHeader}>
                <span style={styles.successIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)' }}>
                  Survey created
                </span>
              </div>
              <p style={styles.successLabel}>Shareable link</p>
              <div style={styles.linkRow}>
                <code style={styles.linkCode}>
                  {`${window.location.origin}${createdSurvey.survey_link}`}
                </code>
                <button
                  className="btn-ghost"
                  style={styles.copyBtn}
                  onClick={() => handleCopy(createdSurvey.survey_link)}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Surveys list */}
        <div style={styles.listPanel}>
          <p style={styles.panelTitle}>
            All Surveys
            <span style={styles.badge}>{surveys.length}</span>
          </p>

          {surveys.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No surveys yet.</p>
          ) : (
            <div style={styles.surveyList}>
              {surveys.map((s) => (
                <SurveyRow key={s.uuid} survey={s} onCopy={() => handleCopy(s.survey_link)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, placeholder, value, onChange, error, type = 'text' }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="label">{label}</label>
      <input
        className="input"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={error ? { borderColor: 'rgba(248,113,113,0.5)' } : {}}
      />
      {error && (
        <p style={{ fontSize: '0.78rem', color: '#F87171', marginTop: 4 }}>{error}</p>
      )}
    </div>
  )
}

function SurveyRow({ survey, onCopy }) {
  return (
    <div style={styles.surveyRow}>
      <div style={styles.surveyInfo}>
        <div style={styles.surveyName}>
          {survey.client_name}
          <span style={styles.companyTag}>{survey.company}</span>
        </div>
        <div style={styles.surveyMeta}>
          <span>{survey.email}</span>
          <span style={styles.dot}>·</span>
          <span>Created {formatDate(survey.created_at)}</span>
          <span style={styles.dot}>·</span>
          <span>{survey.response_count} responses</span>
        </div>
      </div>
      <div style={styles.surveyActions}>
        <span style={{
          ...styles.statusBadge,
          background: survey.status === 'active' ? 'rgba(45,212,191,0.1)' : 'rgba(139,144,154,0.1)',
          color: survey.status === 'active' ? 'var(--accent)' : 'var(--text-secondary)',
        }}>
          {survey.status}
        </span>
        <button className="btn-ghost" style={styles.rowCopyBtn} onClick={onCopy}>
          Copy Link
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: {
    padding: '36px 40px',
    maxWidth: 1200,
  },
  pageHeader: {
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
  },
  layout: {
    display: 'flex',
    gap: 20,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  formPanel: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
    borderRadius: 'var(--radius)',
    padding: '24px',
    width: 340,
    flexShrink: 0,
  },
  panelTitle: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  submitBtn: {
    width: '100%',
    marginTop: 4,
    padding: '12px',
  },
  successBox: {
    marginTop: 20,
    padding: 16,
    background: 'rgba(45,212,191,0.05)',
    border: '1px solid rgba(45,212,191,0.2)',
    borderRadius: 8,
  },
  successHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  successIcon: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'rgba(45,212,191,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successLabel: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  linkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--bg-control)',
    borderRadius: 6,
    padding: '8px 10px',
    border: '1px solid var(--border-subtle)',
  },
  linkCode: {
    flex: 1,
    fontSize: '0.75rem',
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
    minWidth: 0,
  },
  copyBtn: {
    padding: '5px 12px',
    fontSize: '0.78rem',
    flexShrink: 0,
  },
  listPanel: {
    flex: 1,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
    borderRadius: 'var(--radius)',
    padding: '24px',
    minWidth: 0,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-control)',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    fontWeight: 600,
    borderRadius: 20,
    padding: '1px 8px',
    minWidth: 24,
  },
  surveyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid var(--border-subtle)',
  },
  surveyRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '14px 18px',
    background: 'var(--bg-base)',
    borderBottom: '1px solid var(--border-subtle)',
    transition: 'background 0.15s ease',
  },
  surveyInfo: {
    flex: 1,
    minWidth: 0,
  },
  surveyName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  companyTag: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    background: 'var(--bg-control)',
    borderRadius: 6,
    padding: '1px 8px',
    fontWeight: 400,
  },
  surveyMeta: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  dot: {
    color: 'var(--border-subtle)',
  },
  surveyActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 20,
    textTransform: 'capitalize',
  },
  rowCopyBtn: {
    padding: '5px 12px',
    fontSize: '0.78rem',
  },
}
