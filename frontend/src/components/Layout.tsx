import { NavLink, Outlet } from 'react-router-dom'
import ThemeSwitcher from './ThemeSwitcher'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/documents', label: 'Documents', icon: '📄' },
  { to: '/ideas', label: 'Ideas', icon: '💡' },
  { to: '/categories', label: 'Categories', icon: '🗂️' },
  { to: '/companies', label: 'Companies', icon: '🏢' },
]

export default function Layout() {
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
        <ThemeSwitcher />
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
