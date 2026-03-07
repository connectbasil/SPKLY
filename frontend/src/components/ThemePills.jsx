export default function ThemePills({ themes = [] }) {
  if (!themes.length) {
    return <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No themes yet.</p>
  }

  const max = themes[0]?.count || 1

  return (
    <div style={styles.container}>
      {themes.map(({ theme, count }) => {
        const intensity = count / max
        return (
          <div key={theme} style={{
            ...styles.pill,
            background: `rgba(45, 212, 191, ${0.06 + intensity * 0.18})`,
            borderColor: `rgba(45, 212, 191, ${0.1 + intensity * 0.3})`,
          }}>
            <span style={styles.label}>{theme}</span>
            <span style={styles.count}>{count}</span>
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    borderRadius: 20,
    border: '1px solid',
    cursor: 'default',
    transition: 'transform 0.15s ease',
  },
  label: {
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  count: {
    fontSize: '0.75rem',
    color: 'var(--accent)',
    fontWeight: 600,
    background: 'rgba(45,212,191,0.12)',
    borderRadius: 10,
    padding: '1px 6px',
  },
}
