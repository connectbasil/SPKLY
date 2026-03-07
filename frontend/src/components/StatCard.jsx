export default function StatCard({ label, value, sub, accent = false }) {
  return (
    <div style={{
      ...styles.card,
      ...(accent ? styles.cardAccent : {}),
    }}>
      <p style={styles.label}>{label}</p>
      <p style={{
        ...styles.value,
        color: accent ? 'var(--accent)' : 'var(--text-primary)',
      }}>
        {value}
      </p>
      {sub && <p style={styles.sub}>{sub}</p>}
    </div>
  )
}

const styles = {
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
    borderRadius: 'var(--radius)',
    padding: '20px 24px',
    flex: 1,
    minWidth: 0,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default',
  },
  cardAccent: {
    borderColor: 'rgba(45,212,191,0.2)',
    boxShadow: '0 0 0 1px rgba(45,212,191,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
  label: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 8,
  },
  value: {
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    marginBottom: 4,
  },
  sub: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    marginTop: 4,
  },
}
