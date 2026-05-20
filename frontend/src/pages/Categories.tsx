import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categoriesApi, Category } from '../lib/api'

export default function Categories() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await categoriesApi.getAll()
      setCategories(res.data)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    await categoriesApi.create({ name: newName.trim(), description: newDesc.trim() || undefined })
    setNewName('')
    setNewDesc('')
    setShowCreate(false)
    loadCategories()
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm('Delete this category?')) return
    await categoriesApi.delete(id)
    loadCategories()
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Categories</h2>
          <p className="page-subtitle">Organize ideas into custom collections</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Category</button>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: '48px' }}>🗂️</p>
          <p>No categories yet. Click the button above to create one.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {categories.map(cat => (
            <div
              key={cat.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onClick={() => navigate(`/categories/${cat.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{cat.name}</h3>
                <button
                  className="btn btn-ghost"
                  onClick={(e) => handleDelete(e, cat.id)}
                  style={{ fontSize: '14px', color: 'var(--text-muted)', padding: '2px 6px' }}
                  title="Delete"
                >🗑️</button>
              </div>
              {cat.description && (
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {cat.description}
                </p>
              )}
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '10px', fontWeight: 500 }}>
                  {cat.ideaCount} ideas
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <h3 className="modal-title">New Category</h3>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                className="input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. High Conviction, Deep Value, Growth..."
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="textarea"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Optional description for this category"
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!newName.trim()}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
