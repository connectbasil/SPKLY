import { useState } from 'react'
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
    label: 'Surveys',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    to: '/contacts',
    label: 'Contacts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside style={{ ...styles.aside, width: collapsed ? 60 : 220 }}>
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{ ...styles.toggleBtn, justifyContent: collapsed ? 'center' : 'flex-end' }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'transform 0.25s ease', transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Logo */}
      <div style={{ ...styles.logo, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={styles.logoMark}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="2" />
            <path d="M8 12s1.5-3 4-3 4 3 4 3-1.5 3-4 3-4-3-4-3z" fill="var(--accent)" />
            <circle cx="12" cy="12" r="1.5" fill="#0F1115" />
          </svg>
        </div>
        <span style={{ ...styles.logoText, opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : 160 }}>
          SPKLY
        </span>
      </div>

      <hr style={styles.separator} />

      {/* Navigation */}
      <nav style={styles.nav}>
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              ...styles.navItem,
              justifyContent: collapsed ? 'center' : 'flex-start',
              ...(isActive
                ? collapsed
                  ? styles.navItemActiveCollapsed
                  : styles.navItemActive
                : {}),
            })}
          >
            <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
            <span style={{ ...styles.navLabel, opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : 160 }}>
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom badge */}
      <div style={{ ...styles.footer, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={styles.footerBadge}>
          <span style={styles.dot} />
          <span style={{ ...styles.footerText, opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : 160 }}>
            API Connected
          </span>
        </div>
      </div>

      <style>{sidebarCSS}</style>
    </aside>
  )
}

const sidebarCSS = `
  aside { transition: width 0.25s ease; }
`

const styles = {
  aside: {
    minHeight: '100vh',
    background: 'var(--bg-base)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 0 20px',
    flexShrink: 0,
    overflow: 'hidden',
  },
  toggleBtn: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '6px 14px',
    marginBottom: 8,
    transition: 'color 0.15s ease',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 16px 16px',
    overflow: 'hidden',
  },
  logoMark: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    transition: 'opacity 0.2s ease, max-width 0.25s ease',
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
    padding: '0 8px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 10px',
    borderRadius: 8,
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'color 0.15s ease, background 0.15s ease',
    borderLeft: '3px solid transparent',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  navItemActive: {
    color: 'var(--text-primary)',
    background: 'var(--bg-surface)',
    borderLeft: '3px solid var(--accent)',
    borderRadius: '0 8px 8px 0',
    paddingLeft: 7,
  },
  navItemActiveCollapsed: {
    color: 'var(--accent)',
    background: 'var(--bg-surface)',
    borderLeft: '3px solid transparent',
    borderRadius: 8,
  },
  navLabel: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.2s ease, max-width 0.25s ease',
  },
  footer: {
    display: 'flex',
    padding: '16px 16px 0',
    borderTop: '1px solid var(--border-subtle)',
    marginTop: 'auto',
    overflow: 'hidden',
  },
  footerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    overflow: 'hidden',
  },
  footerText: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    transition: 'opacity 0.2s ease, max-width 0.25s ease',
  },
  dot: {
    display: 'inline-block',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'var(--accent)',
    boxShadow: '0 0 6px var(--accent)',
    flexShrink: 0,
  },
}
