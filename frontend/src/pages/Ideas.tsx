import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ideasApi, categoriesApi } from '../lib/api'
import type { Idea, Category } from '../lib/api'

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

type FilterAction = '' | 'BUY' | 'SELL' | 'HOLD' | 'MONITOR' | 'NONE'
type SortKey = 'newest' | 'oldest' | 'company' | 'action'

export default function Ideas() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState<FilterAction>('')
  const [filterConfidence, setFilterConfidence] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterQuarter, setFilterQuarter] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('newest')

  const [selected, setSelected] = useState<Idea | null>(null)
  const [editing, setEditing] = useState(false)
  const [editAction, setEditAction] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editThesis, setEditThesis] = useState('')
  const [editConfidence, setEditConfidence] = useState('')

  const [showCatPicker, setShowCatPicker] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [catSearch, setCatSearch] = useState('')
  const [catChecked, setCatChecked] = useState<Set<number>>(new Set())
  const [catOriginal, setCatOriginal] = useState<Set<number>>(new Set())
  const [catSaving, setCatSaving] = useState(false)

  useEffect(() => {
    ideasApi.getAll().then(res => setIdeas(res.data))
  }, [])

  const openModal = (idea: Idea) => {
    setSelected(idea)
    setEditing(false)
  }

  const closeModal = () => {
    setSelected(null)
    setEditing(false)
  }

  const startEdit = (idea: Idea) => {
    setEditAction(idea.action)
    setEditSummary(idea.summary || '')
    setEditThesis(idea.thesis || '')
    setEditConfidence(idea.confidence || 'MEDIUM')
    setEditing(true)
  }

  const handleUpdate = async () => {
    if (!selected) return
    const res = await ideasApi.update(selected.id, {
      action: editAction as any,
      summary: editSummary || undefined,
      thesis: editThesis || undefined,
      confidence: editConfidence || undefined,
    })
    const updated = res.data
    setIdeas(prev => prev.map(i => i.id === updated.id ? updated : i))
    setSelected(updated)
    setEditing(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this idea?')) return
    await ideasApi.delete(id)
    setIdeas(prev => prev.filter(i => i.id !== id))
    if (selected?.id === id) closeModal()
  }

  const openCatPicker = async () => {
    if (!selected) return
    setCatSearch('')
    setCatSaving(false)
    const [allRes, myRes] = await Promise.all([
      categoriesApi.getAll(),
      categoriesApi.getByIdeaId(selected.id),
    ])
    setCategories(allRes.data)
    const myIds = new Set(myRes.data.map(c => c.id))
    setCatChecked(new Set(myIds))
    setCatOriginal(new Set(myIds))
    setShowCatPicker(true)
  }

  const toggleCat = (catId: number) => {
    setCatChecked(prev => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const handleSaveCats = async () => {
    if (!selected) return
    setCatSaving(true)
    const toAdd = [...catChecked].filter(id => !catOriginal.has(id))
    const toRemove = [...catOriginal].filter(id => !catChecked.has(id))
    await Promise.all([
      ...toAdd.map(catId => categoriesApi.addIdeas(catId, [selected.id])),
      ...toRemove.map(catId => categoriesApi.removeIdea(catId, selected.id)),
    ])
    setCatSaving(false)
    setShowCatPicker(false)
  }

  const filtered = ideas
    .filter(i => {
      if (filterAction && i.action !== filterAction) return false
      if (filterConfidence && i.confidence !== filterConfidence) return false
      if (filterYear || filterQuarter) {
        const fy = filterYear ? Number(filterYear) : null
        const fq = filterQuarter ? Number(filterQuarter) : null
        const iy = i.periodYear ?? 0
        const iq = i.periodQuarter ?? 0
        if (fy !== null && fq !== null) {
          // Show ideas where (year, quarter) >= (fy, fq)
          if (!(iy > fy || (iy === fy && iq >= fq))) return false
        } else if (fy !== null) {
          if (iy < fy) return false
        } else if (fq !== null) {
          if (iq < fq) return false
        }
      }
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

  // Remove availableYears — no longer needed with free-text year input

  const selectedIdx = selected ? filtered.findIndex(i => i.id === selected.id) : -1
  const hasPrev = selectedIdx > 0
  const hasNext = selectedIdx < filtered.length - 1

  const navigateTo = (idea: Idea) => {
    setSelected(idea)
    setEditing(false)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ideas</h1>
          <p className="page-subtitle">{stats.total} ideas — {stats.buy} buy · {stats.sell} sell · {stats.hold} hold · {stats.monitor} monitor</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {/* Row 1: search + action + confidence + sort */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
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
        {/* Row 2: period filters */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>From period:</span>
          <input
            className="input"
            type="number"
            placeholder="Year (e.g. 2024)"
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            style={{ width: '150px' }}
            min="2000"
            max="2099"
          />
          <select className="select" style={{ width: 'auto' }} value={filterQuarter} onChange={e => setFilterQuarter(e.target.value)}>
            <option value="">Any Quarter</option>
            <option value="1">Q1</option>
            <option value="2">Q2</option>
            <option value="3">Q3</option>
            <option value="4">Q4</option>
          </select>
          {(filterYear || filterQuarter) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilterYear(''); setFilterQuarter('') }}>✕ Clear</button>
          )}
        </div>
      </div>

      {/* Ideas Table */}
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
              className="idea-row"
              onClick={() => openModal(idea)}
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
                {idea.periodYear && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: '4px' }}>
                    {idea.periodYear} Q{idea.periodQuarter ?? '?'}
                  </span>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(idea.createdAt).toLocaleDateString()}</span>
                <button
                  className="btn btn-ghost btn-sm btn-danger"
                  onClick={e => { e.stopPropagation(); handleDelete(idea.id) }}
                  title="Delete"
                >🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reading / Edit Modal */}
      {selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={e => e.stopPropagation()}>
            {/* Prev */}
            <button
              onClick={() => hasPrev && navigateTo(filtered[selectedIdx - 1])}
              style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-secondary)', fontSize: '22px', cursor: hasPrev ? 'pointer' : 'default', opacity: editing ? 0 : (hasPrev ? 1 : 0.25), flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', pointerEvents: editing ? 'none' : 'auto' }}
            >‹</button>

            {/* Card */}
            <div className="modal" style={{ maxWidth: 680, width: '70vw', maxHeight: '82vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                {editing ? (
                  <>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Editing idea</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={handleUpdate}>Save</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ActionBadge action={selected.action} />
                      {selected.confidence && <ConfidenceDot level={selected.confidence} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selectedIdx >= 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedIdx + 1} / {filtered.length}</span>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(selected)}>✏️ Edit</button>
                      <button className="btn btn-ghost btn-sm" onClick={openCatPicker} title="Add to category">🗂️</button>
                      <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDelete(selected.id)} title="Delete">🗑️</button>
                      <button className="btn btn-ghost" onClick={closeModal} style={{ fontSize: '16px', lineHeight: 1 }}>✕</button>
                    </div>
                  </>
                )}
              </div>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px' }}>
                {editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>
                      {selected.companyName}
                      {selected.companyTicker && <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '8px' }}>({selected.companyTicker})</span>}
                    </div>
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
                      <span className="form-label">Summary</span>
                      <input className="input" value={editSummary} onChange={e => setEditSummary(e.target.value)} placeholder="Brief viewpoint..." />
                    </div>
                    <div className="form-group">
                      <span className="form-label">Thesis</span>
                      <textarea className="textarea" value={editThesis} onChange={e => setEditThesis(e.target.value)} rows={10} placeholder="Full investment thesis..." style={{ resize: 'vertical', lineHeight: '1.7' }} />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Company + meta */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '22px', fontWeight: 700 }}>{selected.companyName}</div>
                      {selected.companyTicker && <span className="badge-ticker" style={{ marginTop: '4px', display: 'inline-block' }}>{selected.companyTicker}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <div>
                        From&nbsp;
                        <Link to={`/documents/${selected.documentId}`} className="text-link" onClick={closeModal}>
                          📄 {selected.documentTitle}
                        </Link>
                      </div>
                      {selected.periodYear && <div>📅 {selected.periodYear} Q{selected.periodQuarter ?? '?'}</div>}
                      <div>{new Date(selected.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {selected.summary && (
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Summary</p>
                          <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{selected.summary}</p>
                        </div>
                      )}
                      {selected.thesis && (
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Thesis</p>
                          <p style={{ fontSize: '14px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{selected.thesis}</p>
                        </div>
                      )}
                      {!selected.summary && !selected.thesis && (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No content recorded yet. Click ✏️ Edit to add.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Next */}
            <button
              onClick={() => hasNext && navigateTo(filtered[selectedIdx + 1])}
              style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-secondary)', fontSize: '22px', cursor: hasNext ? 'pointer' : 'default', opacity: editing ? 0 : (hasNext ? 1 : 0.25), flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', pointerEvents: editing ? 'none' : 'auto' }}
            >›</button>
          </div>
        </div>
      )}
      {/* Category Picker */}
      {showCatPicker && selected && (
        <div className="modal-overlay" onClick={() => setShowCatPicker(false)}>
          <div className="modal" style={{ maxWidth: 420, width: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <h2 className="modal-title">Manage Categories</h2>
              <button className="btn btn-ghost" onClick={() => setShowCatPicker(false)} style={{ fontSize: '16px' }}>✕</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              <strong>{selected.companyName}</strong> — check to include, uncheck to remove
            </p>
            <input
              className="input"
              placeholder="Search categories..."
              value={catSearch}
              onChange={e => setCatSearch(e.target.value)}
              style={{ marginBottom: '12px' }}
              autoFocus
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '280px', overflowY: 'auto', marginBottom: '16px' }}>
              {categories
                .filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()))
                .map(cat => {
                  const checked = catChecked.has(cat.id)
                  const wasOriginal = catOriginal.has(cat.id)
                  const changed = checked !== wasOriginal
                  return (
                    <label
                      key={cat.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', background: checked ? 'var(--bg-tertiary)' : 'transparent', border: `1px solid ${changed ? 'var(--primary)' : 'var(--border)'}`, transition: 'all 0.15s' }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCat(cat.id)}
                        style={{ width: 16, height: 16, flexShrink: 0 }}
                      />
                      <span style={{ flex: 1, fontSize: '14px' }}>{cat.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cat.ideaCount} ideas</span>
                      {changed && (
                        <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                          {checked ? '+ Add' : '− Remove'}
                        </span>
                      )}
                    </label>
                  )
                })}
              {categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No categories found</p>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCatPicker(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveCats} disabled={catSaving}>
                {catSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
