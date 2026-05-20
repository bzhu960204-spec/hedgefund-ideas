import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ideasApi } from '../lib/api'
import type { Idea } from '../lib/api'

function ActionBadge({ action }: { action: string }) {
  return <span className={`badge badge-${action.toLowerCase()}`}>{action}</span>
}

function ConfidenceDot({ level }: { level: string | null }) {
  if (!level) return null
  const color = level === 'HIGH' ? 'var(--success)' : level === 'LOW' ? 'var(--danger)' : 'var(--warning)'
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
    {level}
  </span>
}

type FilterAction = '' | 'BUY' | 'SELL' | 'HOLD' | 'LONG' | 'SHORT' | 'MONITOR'
type SortKey = 'newest' | 'oldest' | 'company' | 'action'

export default function Ideas() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState<FilterAction>('')
  const [filterConfidence, setFilterConfidence] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('newest')

  // Detail panel
  const [selected, setSelected] = useState<Idea | null>(null)
  const [editing, setEditing] = useState(false)
  const [editAction, setEditAction] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editThesis, setEditThesis] = useState('')
  const [editConfidence, setEditConfidence] = useState('')

  useEffect(() => {
    ideasApi.getAll().then(res => setIdeas(res.data))
  }, [])

  // Keep panel in sync if ideas list refreshes
  useEffect(() => {
    if (selected) setSelected(ideas.find(i => i.id === selected.id) ?? null)
  }, [ideas])

  const openPanel = (idea: Idea) => {
    setSelected(idea)
    setEditing(false)
  }

  const closePanel = () => {
    setSelected(null)
    setEditing(false)
  }

  const startEdit = () => {
    if (!selected) return
    setEditAction(selected.action)
    setEditSummary(selected.summary || '')
    setEditThesis(selected.thesis || '')
    setEditConfidence(selected.confidence || '')
    setEditing(true)
  }

  const handleUpdate = async () => {
    if (!selected) return
    await ideasApi.update(selected.id, { action: editAction, summary: editSummary || undefined, thesis: editThesis || undefined, confidence: editConfidence || undefined } as any)
    const res = await ideasApi.getAll()
    setIdeas(res.data)
    setEditing(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this idea?')) return
    await ideasApi.delete(id)
    setIdeas(prev => prev.filter(i => i.id !== id))
    if (selected?.id === id) closePanel()
  }

  const filtered = ideas
    .filter(i => {
      if (filterAction && i.action !== filterAction) return false
      if (filterConfidence && i.confidence !== filterConfidence) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          i.companyName.toLowerCase().includes(q) ||
          (i.companyTicker?.toLowerCase().includes(q)) ||
          (i.summary?.toLowerCase().includes(q)) ||
          i.documentTitle.toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'company': return a.companyName.localeCompare(b.companyName)
        case 'action': return a.action.localeCompare(b.action)
        default: return 0
      }
    })

  const stats = {
    total: ideas.length,
    buy: ideas.filter(i => i.action === 'BUY').length,
    sell: ideas.filter(i => i.action === 'SELL').length,
    hold: ideas.filter(i => i.action === 'HOLD').length,
    monitor: ideas.filter(i => i.action === 'MONITOR').length,
  }

  return (
    <div className="ideas-layout">
      {/* Left: list */}
      <div className="ideas-list-pane">
        <div className="page-header">
          <div>
            <h1 className="page-title">Ideas</h1>
            <p className="page-subtitle">{stats.total} ideas — {stats.buy} buy · {stats.sell} sell · {stats.hold} hold · {stats.monitor} monitor</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="input-with-icon" style={{ flex: 1, minWidth: '180px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              className="input"
              type="text"
              placeholder="Search company, ticker, summary..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="select" style={{ width: 'auto' }} value={filterAction} onChange={e => setFilterAction(e.target.value as FilterAction)}>
            <option value="">All Actions</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
            <option value="HOLD">HOLD</option>
            <option value="MONITOR">MONITOR</option>
            <option value="NONE">NONE</option>
          </select>
          <select className="select" style={{ width: 'auto' }} value={filterConfidence} onChange={e => setFilterConfidence(e.target.value)}>
            <option value="">All Confidence</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
          <select className="select" style={{ width: 'auto' }} value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="company">Company</option>
            <option value="action">Action</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            <p>No ideas match your filters</p>
          </div>
        ) : (
          <div className="idea-table">
            {filtered.map(idea => (
              <div
                key={idea.id}
                className={`idea-row ${selected?.id === idea.id ? 'idea-row-active' : ''}`}
                onClick={() => openPanel(idea)}
              >
                <div className="idea-row-left">
                  <ActionBadge action={idea.action} />
                  <div className="idea-row-info">
                    <div className="idea-row-company">
                      <span style={{ fontWeight: 600 }}>{idea.companyName}</span>
                      {idea.companyTicker && <span className="badge-ticker">{idea.companyTicker}</span>}
                    </div>
                    {idea.summary && <div className="idea-row-summary">{idea.summary}</div>}
                  </div>
                </div>
                <div className="idea-row-right">
                  <ConfidenceDot level={idea.confidence} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(idea.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: detail panel */}
      {selected && (
        <div className="idea-detail-panel">
          {/* Panel header */}
          <div className="idea-detail-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ActionBadge action={selected.action} />
              {selected.confidence && <ConfidenceDot level={selected.confidence} />}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-secondary btn-sm" onClick={startEdit}>✏️ Edit</button>
              <button className="btn-ghost btn-danger" onClick={() => handleDelete(selected.id)} title="Delete">🗑️</button>
              <button className="btn-ghost" onClick={closePanel} title="Close">✕</button>
            </div>
          </div>

          {/* Company */}
          <div className="idea-detail-company">
            <div style={{ fontSize: '22px', fontWeight: 700 }}>{selected.companyName}</div>
            {selected.companyTicker && <span className="badge-ticker" style={{ fontSize: '14px', padding: '3px 10px' }}>{selected.companyTicker}</span>}
          </div>

          {/* Source document */}
          <div className="idea-detail-meta">
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>From document</span>
            <Link to={`/documents/${selected.documentId}`} className="text-link" style={{ fontSize: '13px' }}>
              📄 {selected.documentTitle}
            </Link>
          </div>
          <div className="idea-detail-meta">
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Recorded</span>
            <span style={{ fontSize: '13px' }}>{new Date(selected.createdAt).toLocaleString()}</span>
          </div>

          <div className="idea-detail-divider" />

          {/* Thesis / Summary */}
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <span className="form-label">Action</span>
                  <select className="select" value={editAction} onChange={e => setEditAction(e.target.value)}>
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                    <option value="HOLD">HOLD</option>
                    <option value="MONITOR">MONITOR</option>
                    <option value="NONE">NONE</option>
                  </select>
                </div>
                <div className="form-group">
                  <span className="form-label">Confidence</span>
                  <select className="select" value={editConfidence} onChange={e => setEditConfidence(e.target.value)}>
                    <option value="">—</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <span className="form-label">Summary (one-liner)</span>
                <input
                  className="input"
                  value={editSummary}
                  onChange={e => setEditSummary(e.target.value)}
                  placeholder="Brief summary..."
                />
              </div>
              <div className="form-group">
                <span className="form-label">Thesis (full content)</span>
                <textarea
                  className="textarea"
                  value={editThesis}
                  onChange={e => setEditThesis(e.target.value)}
                  rows={12}
                  placeholder="Full investment thesis or original text from document..."
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleUpdate}>Save</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Summary */}
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Summary</p>
                {selected.summary ? (
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)' }}>{selected.summary}</p>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No summary.</p>
                )}
              </div>
              {/* Thesis */}
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thesis</p>
                {selected.thesis ? (
                  <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{selected.thesis}</p>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No thesis recorded yet. Click Edit to add one.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
