function sentimentStyle(sentiment) {
  if (sentiment === 'positive') return { color: 'var(--accent)', background: 'rgba(45,212,191,0.1)' }
  if (sentiment === 'negative') return { color: '#F87171', background: 'rgba(248,113,113,0.1)' }
  return { color: 'var(--text-secondary)', background: 'rgba(139,144,154,0.1)' }
}

function scoreColor(score) {
  if (score >= 8) return 'var(--accent)'
  if (score >= 6) return '#FBBF24'
  return '#F87171'
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function ResponseExplorer({ responses = [] }) {
  if (!responses.length) {
    return (
      <div style={styles.empty}>
        <p>No responses recorded yet.</p>
      </div>
    )
  }

  return (
    <div style={styles.list}>
      {responses.map((r) => (
        <div key={r.id} style={styles.row}>
          {/* Score */}
          <div style={styles.scoreCol}>
            <span style={{ ...styles.score, color: scoreColor(r.csat_score) }}>
              {r.csat_score?.toFixed(1)}
            </span>
            <span style={styles.scoreLabel}>/ 10</span>
          </div>

          {/* Body */}
          <div style={styles.body}>
            <p style={styles.summary}>{r.summary}</p>
            <div style={styles.meta}>
              {r.themes?.slice(0, 3).map((t) => (
                <span key={t} style={styles.tag}>{t}</span>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div style={styles.right}>
            <span style={{ ...styles.badge, ...sentimentStyle(r.sentiment) }}>
              {r.sentiment}
            </span>
            <span style={styles.date}>{formatDate(r.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    maxHeight: 480,
    overflowY: 'auto',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border-subtle)',
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    padding: '16px 20px',
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border-subtle)',
    transition: 'background 0.15s ease',
    cursor: 'default',
  },
  scoreCol: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 2,
    minWidth: 52,
    flexShrink: 0,
  },
  score: {
    fontSize: '1.3rem',
    fontWeight: 700,
    letterSpacing: '-0.03em',
  },
  scoreLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  summary: {
    fontSize: '0.88rem',
    color: 'var(--text-primary)',
    lineHeight: 1.5,
    marginBottom: 8,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  meta: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    background: 'var(--bg-control)',
    borderRadius: 6,
    padding: '2px 8px',
    border: '1px solid var(--border-subtle)',
  },
  right: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  badge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 20,
    textTransform: 'capitalize',
  },
  date: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
  },
  empty: {
    padding: '40px 20px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
}
