import { useState, useEffect, useRef } from 'react'

const themes = [
  { id: 'material', label: 'Material', desc: 'Google-style' },
  { id: 'antd', label: 'Ant Design', desc: 'Enterprise' },
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
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    applyTheme(current)
  }, [current])

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
      <button
        className="btn btn-ghost"
        style={{ width: '100%', justifyContent: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}
        onClick={() => setOpen(v => !v)}
        title="Settings"
      >
        ⚙️ Settings
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '12px',
          right: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.12)',
          zIndex: 100,
          marginBottom: '4px',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Theme</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => { setCurrent(t.id); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: '6px', border: '1px solid',
                  borderColor: current === t.id ? 'var(--primary)' : 'var(--border)',
                  background: current === t.id ? 'var(--primary-light, var(--bg-tertiary))' : 'transparent',
                  cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)',
                  fontWeight: current === t.id ? 600 : 400,
                }}
              >
                <span>{t.label}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.desc}</span>
                {current === t.id && <span style={{ color: 'var(--primary)', fontSize: '14px' }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
