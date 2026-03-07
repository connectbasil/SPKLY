import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    to: '/admin',
    label: 'Admin',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  return (
    <aside style={styles.aside}>
      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoMark}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="2" />
            <path d="M8 12s1.5-3 4-3 4 3 4 3-1.5 3-4 3-4-3-4-3z" fill="var(--accent)" />
            <circle cx="12" cy="12" r="1.5" fill="#0F1115" />
          </svg>
        </div>
        <span style={styles.logoText}>VoicePulse</span>
      </div>

      <hr style={styles.separator} />

      {/* Navigation */}
      <nav style={styles.nav}>
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            ...styles.navItem,
            ...(isActive ? styles.navItemActive : {}),
          })}>
            <span style={{ opacity: 0.9, display: 'flex' }}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom badge */}
      <div style={styles.footer}>
        <div style={styles.footerBadge}>
          <span style={styles.dot} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>API Connected</span>
        </div>
      </div>
    </aside>
  )
}

const styles = {
  aside: {
    width: 220,
    minHeight: '100vh',
    background: 'var(--bg-base)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
    flexShrink: 0,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 20px 16px',
  },
  logoMark: {
    display: 'flex',
    alignItems: 'center',
  },
  logoText: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  separator: {
    border: 'none',
    borderTop: '1px solid var(--border-subtle)',
    margin: '0 0 16px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '0 10px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 8,
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'color 0.15s ease, background 0.15s ease',
    borderLeft: '3px solid transparent',
  },
  navItemActive: {
    color: 'var(--text-primary)',
    background: 'var(--bg-surface)',
    borderLeft: '3px solid var(--accent)',
    borderRadius: '0 8px 8px 0',
    paddingLeft: 9,
  },
  footer: {
    padding: '16px 20px 0',
    borderTop: '1px solid var(--border-subtle)',
    marginTop: 'auto',
  },
  footerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    display: 'inline-block',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'var(--accent)',
    boxShadow: '0 0 6px var(--accent)',
  },
}
