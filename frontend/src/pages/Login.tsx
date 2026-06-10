import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface LocationState {
  from?: { pathname: string }
}

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from?.pathname ?? '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username.trim(), password)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Login failed'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: 20,
    }}>
      <form
        onSubmit={onSubmit}
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--card-shadow)',
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>📈</span>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>HF Ideas</h1>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sign in to continue</div>
          </div>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Username</span>
          <input
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          />
        </label>

        {error && (
          <div style={{
            fontSize: 13,
            color: 'var(--danger)',
            background: 'rgba(211,47,47,0.08)',
            padding: '8px 12px',
            borderRadius: 'var(--radius)',
          }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '10px 16px',
            background: 'var(--accent)',
            color: 'white',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
            opacity: submitting ? 0.6 : 1,
          }}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
          Default admin: <code>admin / admin123</code> &mdash; change it after first login.
        </p>
      </form>
    </div>
  )
}
