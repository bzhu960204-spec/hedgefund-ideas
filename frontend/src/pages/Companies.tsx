import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { companiesApi } from '../lib/api'
import type { Company } from '../lib/api'

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [ticker, setTicker] = useState('')
  const [sector, setSector] = useState('')

  const loadCompanies = () => {
    companiesApi.getAll(search || undefined).then(res => setCompanies(res.data)).catch(() => {})
  }

  useEffect(() => {
    loadCompanies()
  }, [search])

  const handleCreate = async () => {
    if (!name.trim()) return
    await companiesApi.create({ name, ticker: ticker || undefined, sector: sector || undefined })
    resetForm()
    setShowAdd(false)
    loadCompanies()
  }

  const handleUpdate = async (id: number) => {
    await companiesApi.update(id, { name, ticker, sector })
    resetForm()
    setEditingId(null)
    loadCompanies()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this company and all associated ideas?')) return
    await companiesApi.delete(id)
    loadCompanies()
  }

  const startEdit = (company: Company) => {
    setEditingId(company.id)
    setName(company.name)
    setTicker(company.ticker || '')
    setSector(company.sector || '')
  }

  const resetForm = () => {
    setName('')
    setTicker('')
    setSector('')
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-subtitle">Track companies mentioned in your research</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); resetForm() }}>
          + Add Company
        </button>
      </div>

      <div className="input-with-icon" style={{ marginBottom: '24px' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          className="input"
          type="text"
          placeholder="Search by name or ticker..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>New Company</h3>
          <div className="form-row form-row-3">
            <div className="form-group">
              <span className="form-label">Name *</span>
              <input className="input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Meta Platforms" />
            </div>
            <div className="form-group">
              <span className="form-label">Ticker</span>
              <input className="input" type="text" value={ticker} onChange={e => setTicker(e.target.value)} placeholder="e.g. META" />
            </div>
            <div className="form-group">
              <span className="form-label">Sector</span>
              <input className="input" type="text" value={sector} onChange={e => setSector(e.target.value)} placeholder="e.g. Technology" />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={!name.trim()}>Create</button>
          </div>
        </div>
      )}

      {companies.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4M5 21V10.87M19 21V10.87"/></svg>
          <p>No companies yet</p>
          <p style={{ marginTop: '4px', fontSize: '13px' }}>Add companies to track investment ideas</p>
        </div>
      ) : (
        <div className="company-grid">
          {companies.map(company => (
            <div key={company.id} className="company-card">
              {editingId === company.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input className="input" type="text" value={name} onChange={e => setName(e.target.value)} />
                  <div className="form-row form-row-2">
                    <input className="input" type="text" value={ticker} onChange={e => setTicker(e.target.value)} placeholder="Ticker" />
                    <input className="input" type="text" value={sector} onChange={e => setSector(e.target.value)} placeholder="Sector" />
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>✕</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleUpdate(company.id)}>✓</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="company-card-header">
                    <Link to={`/companies/${company.id}`} className="company-name">{company.name}</Link>
                    <div className="company-actions">
                      <button className="btn-ghost" onClick={() => startEdit(company)} title="Edit">✏️</button>
                      <button className="btn-ghost btn-danger" onClick={() => handleDelete(company.id)} title="Delete">🗑️</button>
                    </div>
                  </div>
                  <div className="company-meta">
                    {company.ticker && <span className="badge-ticker">{company.ticker}</span>}
                    {company.sector && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{company.sector}</span>}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
