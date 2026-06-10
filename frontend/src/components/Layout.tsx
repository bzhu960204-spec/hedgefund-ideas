import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import ThemeSwitcher from './ThemeSwitcher'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/documents', label: 'Documents', icon: '📄' },
  { to: '/ideas', label: 'Ideas', icon: '💡' },
  { to: '/categories', label: 'Categories', icon: '🗂️' },
  { to: '/companies', label: 'Companies', icon: '🏢' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span style={{ fontSize: '24px' }}>📈</span>
            <h1>HF Ideas</h1>
          </div>
          <p className="sidebar-subtitle">Investment Research Manager</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.username}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                {user.role}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              style={{
                padding: '4px 10px',
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.85)',
                borderRadius: 6,
                fontSize: 12,
              }}>
              Logout
            </button>
          </div>
        )}
        <ThemeSwitcher />
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

