import { useState, useEffect } from 'react'

const themes = [
  { id: 'material', label: 'Material', desc: 'Google风格' },
  { id: 'antd', label: 'Ant Design', desc: '企业中后台' },
]

function getStoredTheme(): string {
  return localStorage.getItem('hf-theme') || 'material'
}

function applyTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('hf-theme', theme)
}

export default function ThemeSwitcher() {
  const [current, setCurrent] = useState(getStoredTheme)

  useEffect(() => {
    applyTheme(current)
  }, [current])

  return (
    <div className="theme-switcher">
      <div className="theme-switcher-label">Theme</div>
      <div className="theme-options">
        {themes.map(t => (
          <button
            key={t.id}
            className={`theme-btn ${current === t.id ? 'active' : ''}`}
            data-t={t.id}
            onClick={() => setCurrent(t.id)}
            title={`${t.label} - ${t.desc}`}
          >
            <span className="theme-btn-tooltip">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
