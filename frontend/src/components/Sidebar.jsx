import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useMode } from '../context/ModeContext'

const NAV_ITEMS = [
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
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { mode, setMode } = useMode()

  return (
    <aside style={{ ...styles.aside, width: collapsed ? 60 : 220 }}>
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

      {/* Mode toggle */}
      <div style={{ ...styles.footer, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        {collapsed ? (
          <button
            onClick={() => setMode(mode === 'test' ? 'live' : 'test')}
            style={{ ...styles.modeDot, background: mode === 'test' ? '#F59E0B' : '#10B981' }}
            title={`Switch to ${mode === 'test' ? 'live' : 'test'} mode`}
          />
        ) : (
          <div style={styles.modePill}>
            {['test', 'live'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  ...styles.modeOption,
                  background: mode === m ? (m === 'test' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)') : 'transparent',
                  color: mode === m ? (m === 'test' ? '#F59E0B' : '#10B981') : 'var(--text-secondary)',
                  fontWeight: mode === m ? 700 : 500,
                }}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Edge toggle tab */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={styles.toggleTab}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'transform 0.25s ease', transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

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
    padding: '20px 0 20px',
    flexShrink: 0,
    overflow: 'visible',
    position: 'relative',
  },
  toggleTab: {
    position: 'absolute',
    right: -13,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
    transition: 'background 0.15s ease, color 0.15s ease',
    padding: 0,
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
  modePill: {
    display: 'flex',
    background: 'var(--bg-control)',
    borderRadius: 8,
    padding: 3,
    gap: 2,
    overflow: 'hidden',
  },
  modeOption: {
    flex: 1,
    padding: '5px 10px',
    border: 'none',
    borderRadius: 6,
    fontSize: '0.72rem',
    letterSpacing: '0.04em',
    cursor: 'pointer',
    transition: 'background 0.15s ease, color 0.15s ease',
    whiteSpace: 'nowrap',
  },
  modeDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
  },
}
