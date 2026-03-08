import { useState, useEffect } from 'react'
import { MOCK_SURVEYS } from '../mockData'

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

// ─── Main component ───────────────────────────────────────────────────────────

export default function Admin() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [stepErrors, setStepErrors] = useState({})
  const [surveys, setSurveys] = useState([])
  const [createdSurvey, setCreatedSurvey] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')

  useEffect(() => {
    fetch(`${API}/surveys`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => setSurveys(Array.isArray(data) && data.length ? data : MOCK_SURVEYS))
      .catch(() => setSurveys(MOCK_SURVEYS))
  }, [])

  function selectType(typeId) {
    const t = SURVEY_TYPES.find((t) => t.id === typeId)
    setForm((f) => ({
      ...f,
      survey_type: typeId,
      scoring_enabled: t.scored,
      questions: DEFAULT_QUESTIONS[typeId] || [],
    }))
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

  function goBack() {
    setStepErrors({})
    setStep((s) => s - 1)
  }

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
    const payload = {
      title: form.title,
      survey_type: form.survey_type,
      intent: form.intent,
      audience: form.audience,
      tone: form.tone,
      scoring_enabled: form.scoring_enabled,
      custom_questions: form.questions,
    }
    try {
      const res = await fetch(`${API}/surveys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      setCreatedSurvey(created)
      setSurveys((prev) => [{ ...created, response_count: 0 }, ...prev])
      setStep(4)
    } catch {
      const demo = {
        id: Date.now(),
        uuid: `demo-${Date.now()}`,
        title: form.title,
        survey_type: form.survey_type,
        audience: form.audience,
        tone: form.tone,
        status: 'active',
        created_at: new Date().toISOString(),
        survey_link: `/survey/demo-${Date.now()}`,
        response_count: 0,
      }
      setCreatedSurvey(demo)
      setSurveys((prev) => [demo, ...prev])
      setStep(4)
    } finally {
      setCreating(false)
    }
  }

  function startNew() {
    setForm(EMPTY_FORM)
    setCreatedSurvey(null)
    setStepErrors({})
    setNewQuestion('')
    setStep(1)
  }

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Surveys</h1>
        <p style={styles.pageSubtitle}>Create and manage your voice feedback surveys</p>
      </div>

      {/* Wizard panel */}
      <div style={styles.wizardPanel}>
        {step < 4 && <StepIndicator current={step} />}

        {step === 1 && (
          <Step1Basics
            form={form}
            setForm={setForm}
            selectType={selectType}
            errors={stepErrors}
          />
        )}
        {step === 2 && (
          <Step2Context form={form} setForm={setForm} errors={stepErrors} />
        )}
        {step === 3 && (
          <Step3Configure
            form={form}
            setForm={setForm}
            newQuestion={newQuestion}
            setNewQuestion={setNewQuestion}
            addQuestion={addQuestion}
            removeQuestion={removeQuestion}
          />
        )}
        {step === 4 && <SuccessStep survey={createdSurvey} onNew={startNew} />}

        {step < 4 && (
          <div style={styles.wizardNav}>
            {step > 1 ? (
              <button className="btn-ghost" style={styles.navBtn} onClick={goBack}>
                Back
              </button>
            ) : (
              <div />
            )}
            {step < 3 && (
              <button className="btn-primary" style={styles.navBtn} onClick={goNext}>
                Continue
              </button>
            )}
            {step === 3 && (
              <button
                className="btn-primary"
                style={styles.navBtn}
                onClick={handleSubmit}
                disabled={creating}
              >
                {creating ? 'Creating…' : 'Create Survey'}
              </button>
            )}
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
              <SurveyRow key={s.uuid} survey={s} />
            ))}
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
              <span style={{
                fontSize: '0.75rem', whiteSpace: 'nowrap',
                color: active ? 'var(--text-primary)' : done ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 400,
              }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 1, margin: '-14px 12px 0',
                background: done ? 'rgba(45,212,191,0.4)' : 'var(--border-subtle)',
              }} />
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
        <input
          className="input"
          placeholder="e.g. Q1 Onboarding Feedback"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          style={errors.title ? { borderColor: 'rgba(248,113,113,0.5)' } : {}}
        />
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
    <button
      onClick={onSelect}
      style={{
        background: selected ? 'rgba(45,212,191,0.07)' : 'var(--bg-control)',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-subtle)'}`,
        borderRadius: 10,
        padding: '14px 16px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, background 0.15s ease',
        outline: 'none',
      }}
    >
      <div style={{ color: selected ? 'var(--accent)' : 'var(--text-secondary)', marginBottom: 8 }}>
        <TypeIcon id={type.id} />
      </div>
      <div style={{
        fontSize: '0.88rem', fontWeight: 600, marginBottom: 3,
        color: selected ? 'var(--accent)' : 'var(--text-primary)',
      }}>
        {type.name}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        {type.desc}
      </div>
      {type.scored && (
        <div style={{
          marginTop: 8, fontSize: '0.7rem', fontWeight: 600,
          color: selected ? 'var(--accent)' : 'var(--text-secondary)',
          background: selected ? 'rgba(45,212,191,0.12)' : 'var(--bg-surface)',
          borderRadius: 4, padding: '2px 7px', display: 'inline-block',
          border: `1px solid ${selected ? 'rgba(45,212,191,0.3)' : 'var(--border-subtle)'}`,
        }}>
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
        <textarea
          className="input"
          rows={4}
          placeholder="e.g. We want to understand where new users get stuck during onboarding and what would make it easier."
          value={form.intent}
          onChange={(e) => setForm((f) => ({ ...f, intent: e.target.value }))}
          style={{ resize: 'vertical', ...(errors.intent ? { borderColor: 'rgba(248,113,113,0.5)' } : {}) }}
        />
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
      {/* Scoring toggle */}
      <div style={{ marginBottom: 28 }}>
        <label className="label">Scoring</label>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-control)', borderRadius: 10,
          border: '1px solid var(--border-subtle)', padding: '14px 16px',
        }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
              {form.scoring_enabled
                ? `Enabled — ${selectedType?.scale || ''} scale`
                : 'Disabled — qualitative only'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {selectedType?.scored
                ? 'Auto-enabled for this type. Can be turned off.'
                : 'This survey type is unscored by default.'}
            </div>
          </div>
          <Toggle
            value={form.scoring_enabled}
            onChange={(v) => setForm((f) => ({ ...f, scoring_enabled: v }))}
          />
        </div>
      </div>

      {/* Questions */}
      <div>
        <label className="label">Questions</label>
        <p style={helpText}>These guide the voice agent. Pre-filled based on survey type — remove or add as needed.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {form.questions.map((q, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: 'var(--bg-control)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: '10px 12px',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingTop: 2, minWidth: 18, flexShrink: 0 }}>
                {i + 1}
              </span>
              <span style={{ flex: 1, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {q}
              </span>
              <button
                onClick={() => removeQuestion(i)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', padding: '2px 4px', flexShrink: 0,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
          {form.questions.length === 0 && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '8px 0' }}>
              No questions yet — add some below.
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            placeholder="Add a custom question…"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
            style={{ flex: 1 }}
          />
          <button
            className="btn-ghost"
            onClick={addQuestion}
            style={{ padding: '10px 16px', flexShrink: 0 }}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Success step ─────────────────────────────────────────────────────────────

function SuccessStep({ survey, onNew }) {
  const [copied, setCopied] = useState(false)
  const link = survey ? `${window.location.origin}${survey.survey_link}` : ''

  function copy() {
    navigator.clipboard.writeText(link).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%', margin: '0 auto 16px',
        background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
        Survey created
      </h2>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
        Share this link with your respondents to start collecting voice feedback.
      </p>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-control)', borderRadius: 8, padding: '10px 12px',
        border: '1px solid var(--border-subtle)', marginBottom: 20, textAlign: 'left',
      }}>
        <code style={{ flex: 1, fontSize: '0.78rem', color: 'var(--text-primary)', fontFamily: 'monospace', wordBreak: 'break-all', minWidth: 0 }}>
          {link}
        </code>
        <button className="btn-ghost" style={{ padding: '5px 14px', fontSize: '0.8rem', flexShrink: 0 }} onClick={copy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <button className="btn-ghost" style={{ width: '100%', padding: '11px' }} onClick={onNew}>
        Create Another Survey
      </button>
    </div>
  )
}

// ─── Survey row ───────────────────────────────────────────────────────────────

function SurveyRow({ survey }) {
  const typeDef = SURVEY_TYPES.find((t) => t.id === survey.survey_type)

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function copyLink() {
    const full = `${window.location.origin}${survey.survey_link}`
    navigator.clipboard.writeText(full).catch(() => {})
  }

  return (
    <div style={styles.surveyRow}>
      <div style={styles.surveyInfo}>
        <div style={styles.surveyName}>
          {survey.title || survey.client_name}
          {typeDef && (
            <span style={{
              ...styles.tag,
              color: 'var(--accent)', background: 'rgba(45,212,191,0.08)',
              border: '1px solid rgba(45,212,191,0.2)',
            }}>
              {typeDef.name}
            </span>
          )}
          {survey.audience && (
            <span style={styles.tag}>{survey.audience}</span>
          )}
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
        <span style={{
          ...styles.statusBadge,
          background: survey.status === 'active' ? 'rgba(45,212,191,0.1)' : 'rgba(139,144,154,0.1)',
          color: survey.status === 'active' ? 'var(--accent)' : 'var(--text-secondary)',
        }}>
          {survey.status}
        </span>
        <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: '0.78rem' }} onClick={copyLink}>
          Copy Link
        </button>
      </div>
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function PillSelector({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            padding: '7px 18px', borderRadius: 20,
            fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
            border: `1px solid ${value === opt ? 'var(--accent)' : 'var(--border-subtle)'}`,
            background: value === opt ? 'rgba(45,212,191,0.1)' : 'var(--bg-control)',
            color: value === opt ? 'var(--accent)' : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, position: 'relative',
        background: value ? 'var(--accent)' : 'var(--bg-surface)',
        border: `1px solid ${value ? 'var(--accent)' : 'var(--border-subtle)'}`,
        cursor: 'pointer', transition: 'background 0.2s ease', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: value ? 21 : 2,
        width: 18, height: 18, borderRadius: '50%',
        background: value ? '#0F1115' : 'var(--text-secondary)',
        transition: 'left 0.2s ease',
      }} />
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

const fieldError = { fontSize: '0.78rem', color: '#F87171', marginTop: 4 }
const helpText   = { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }
const sectionLabel = { fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }
const typeGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }

const styles = {
  page: {
    padding: '36px 40px',
    maxWidth: 1200,
  },
  pageHeader: {
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: '1.5rem', fontWeight: 700,
    color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: '0.88rem', color: 'var(--text-secondary)',
  },
  wizardPanel: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
    borderRadius: 'var(--radius)',
    padding: '28px 32px',
    maxWidth: 700,
    marginBottom: 20,
  },
  wizardNav: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border-subtle)',
  },
  navBtn: {
    padding: '10px 24px', minWidth: 100,
  },
  listPanel: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
    borderRadius: 'var(--radius)',
    padding: '24px',
  },
  panelTitle: {
    fontSize: '0.95rem', fontWeight: 600,
    color: 'var(--text-primary)', marginBottom: 20,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-control)', color: 'var(--text-secondary)',
    fontSize: '0.75rem', fontWeight: 600,
    borderRadius: 20, padding: '1px 8px', minWidth: 24,
  },
  surveyList: {
    display: 'flex', flexDirection: 'column', gap: 1,
    borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-subtle)',
  },
  surveyRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 16, padding: '14px 18px', background: 'var(--bg-base)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  surveyInfo: { flex: 1, minWidth: 0 },
  surveyName: {
    fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)',
    marginBottom: 4, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap',
  },
  tag: {
    fontSize: '0.72rem', fontWeight: 500,
    background: 'var(--bg-control)', color: 'var(--text-secondary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 5, padding: '1px 7px',
  },
  surveyMeta: {
    fontSize: '0.78rem', color: 'var(--text-secondary)',
    display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
  },
  dot: { color: 'var(--border-subtle)' },
  surveyActions: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  statusBadge: {
    fontSize: '0.75rem', fontWeight: 600,
    padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize',
  },
}
