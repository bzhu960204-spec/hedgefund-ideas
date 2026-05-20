import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { categoriesApi, ideasApi, Category, Idea } from '../lib/api'

const ACTION_COLORS: Record<string, string> = {
  BUY: '#4caf50', SELL: '#f44336', HOLD: '#ff9800', MONITOR: '#2196f3', NONE: '#9e9e9e',
}

function ActionBadge({ action }: { action: string }) {
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
      background: `${ACTION_COLORS[action] || '#9e9e9e'}20`,
      color: ACTION_COLORS[action] || '#9e9e9e',
      textTransform: 'uppercase',
    }}>{action}</span>
  )
}

export default function CategoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [category, setCategory] = useState<Category | null>(null)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [allIdeas, setAllIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    if (!id) return
    try {
      const [catRes, ideasRes] = await Promise.all([
        categoriesApi.getById(Number(id)),
        categoriesApi.getIdeas(Number(id)),
      ])
      setCategory(catRes.data)
      setIdeas(ideasRes.data)
      setEditName(catRes.data.name)
      setEditDesc(catRes.data.description || '')
    } finally {
      setLoading(false)
    }
  }

  const openPicker = async () => {
    const res = await ideasApi.getAll()
    setAllIdeas(res.data)
    setSelectedIds(new Set())
    setPickerSearch('')
    setShowPicker(true)
  }

  const handleAddIdeas = async () => {
    if (selectedIds.size === 0) return
    await categoriesApi.addIdeas(Number(id), Array.from(selectedIds))
    setShowPicker(false)
    loadData()
  }

  const handleRemoveIdea = async (ideaId: number) => {
    await categoriesApi.removeIdea(Number(id), ideaId)
    loadData()
  }

  const handleSaveEdit = async () => {
    if (!editName.trim()) return
    await categoriesApi.update(Number(id), { name: editName.trim(), description: editDesc.trim() })
    setEditing(false)
    loadData()
  }

  const toggleSelect = (ideaId: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(ideaId)) next.delete(ideaId)
      else next.add(ideaId)
      return next
    })
  }

  if (loading) return <div className="loading">Loading...</div>
  if (!category) return <div>Category not found</div>

  // Filter out ideas already in category
  const existingIds = new Set(ideas.map(i => i.id))
  const filteredPickerIdeas = allIdeas
    .filter(i => !existingIds.has(i.id))
    .filter(i => {
      if (!pickerSearch) return true
      const q = pickerSearch.toLowerCase()
      return (
        i.companyName.toLowerCase().includes(q) ||
        (i.companyTicker?.toLowerCase().includes(q)) ||
        (i.summary?.toLowerCase().includes(q)) ||
        i.action.toLowerCase().includes(q)
      )
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/categories')} style={{ marginBottom: '8px', fontSize: '13px' }}>
          ← Back to Categories
        </button>
        {editing ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                className="input"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}
                autoFocus
              />
              <input
                className="input"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Description (optional)"
                style={{ fontSize: '13px' }}
              />
            </div>
            <button className="btn-primary" onClick={handleSaveEdit} style={{ fontSize: '13px' }}>Save</button>
            <button className="btn btn-ghost" onClick={() => setEditing(false)} style={{ fontSize: '13px' }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0 }}>{category.name}</h2>
            <button className="btn btn-ghost" onClick={() => setEditing(true)} style={{ fontSize: '12px' }}>✏️ Edit</button>
          </div>
        )}
        {!editing && category.description && (
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>{category.description}</p>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{ideas.length} Ideas</span>
        <button className="btn btn-primary" onClick={openPicker}>+ Add Ideas</button>
      </div>

      {/* Ideas list */}
      {ideas.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: '36px' }}>📭</p>
          <p>No ideas in this category yet. Click Add Ideas above.</p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Company</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Action</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Summary</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Confidence</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {ideas.map(idea => (
                <tr key={idea.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 500 }}>{idea.companyName}</div>
                    {idea.companyTicker && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{idea.companyTicker}</span>}
                  </td>
                  <td style={{ padding: '10px 12px' }}><ActionBadge action={idea.action} /></td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {idea.summary || '—'}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '12px' }}>{idea.confidence || '—'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <button
                      className="btn btn-ghost btn-danger"
                      onClick={() => handleRemoveIdea(idea.id)}
                      style={{ fontSize: '12px' }}
                      title="Remove from category"
                    >Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Idea Picker Modal */}
      {showPicker && (
        <div className="modal-overlay" onClick={() => setShowPicker(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0 }}>Select Ideas</h3>
                <button className="btn btn-ghost" onClick={() => setShowPicker(false)} style={{ fontSize: '16px' }}>✕</button>
              </div>
              <input
                className="input"
                placeholder="Search company, ticker, summary..."
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Idea list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {filteredPickerIdeas.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  {allIdeas.length === existingIds.size ? 'All ideas are already in this category' : 'No matching results'}
                </p>
              ) : (
                filteredPickerIdeas.map(idea => (
                  <div
                    key={idea.id}
                    onClick={() => toggleSelect(idea.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px',
                      cursor: 'pointer', background: selectedIds.has(idea.id) ? 'var(--bg-tertiary)' : 'transparent',
                      borderLeft: selectedIds.has(idea.id) ? '3px solid var(--accent)' : '3px solid transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(idea.id)}
                      onChange={() => toggleSelect(idea.id)}
                      style={{ flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 500, fontSize: '14px' }}>{idea.companyName}</span>
                        {idea.companyTicker && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{idea.companyTicker}</span>}
                        <ActionBadge action={idea.action} />
                      </div>
                      {idea.summary && (
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {idea.summary}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {selectedIds.size} selected
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => setShowPicker(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAddIdeas} disabled={selectedIds.size === 0}>
                  Add ({selectedIds.size})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
