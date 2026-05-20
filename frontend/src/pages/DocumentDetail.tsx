import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { documentsApi, ideasApi, companiesApi, categoriesApi } from '../lib/api'
import type { Document, Idea, Company, Category } from '../lib/api'

function ActionBadge({ action }: { action: string }) {
  return <span className={`badge badge-${action.toLowerCase()}`}>{action}</span>
}

const IMPORT_PLACEHOLDER = `[
  {
    "companyTicker": "META",
    "companyName": "Meta Platforms",
    "action": "BUY",
    "summary": "Trading below intrinsic value with strong FCF generation.",
    "thesis": "Meta is currently trading at 18x forward earnings while generating $50B+ in annual FCF...",
    "confidence": "HIGH"
  },
  {
    "companyTicker": "GOOGL",
    "companyName": "Alphabet",
    "action": "MONITOR",
    "summary": "AI integration may drive search monetisation improvement.",
    "thesis": "Google's AI Overviews are increasing search engagement rather than cannibalizing ad clicks...",
    "confidence": "MEDIUM"
  }
]`

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>()
  const [document, setDocument] = useState<Document | null>(null)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)
  const [dragX, setDragXState] = useState(0)
  const dragXRef = useRef(0)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartY = useRef(0)
  const isHSwipe = useRef(false)

  const setDragX = (v: number) => { dragXRef.current = v; setDragXState(v) }

  const onSwipeStart = (x: number, y: number) => {
    isDragging.current = true
    isHSwipe.current = false
    dragStartX.current = x
    dragStartY.current = y
  }
  const onSwipeMove = (x: number, y: number) => {
    if (!isDragging.current) return
    const dx = x - dragStartX.current
    const dy = y - dragStartY.current
    if (!isHSwipe.current) {
      if (Math.abs(dx) > 8) isHSwipe.current = true
      else if (Math.abs(dy) > 8) { isDragging.current = false; return }
      else return
    }
    setDragX(dx)
  }
  const onSwipeEnd = (idx: number) => {
    if (!isDragging.current) return
    isDragging.current = false
    isHSwipe.current = false
    const dx = dragXRef.current
    setDragX(0)
    if (dx < -80 && idx < ideas.length - 1) setSelectedIdea(ideas[idx + 1])
    else if (dx > 80 && idx > 0) setSelectedIdea(ideas[idx - 1])
  }
  const [companies, setCompanies] = useState<Company[]>([])
  const [showAddIdea, setShowAddIdea] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)

  const [isEditingIdea, setIsEditingIdea] = useState(false)
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

  const startEditingIdea = (idea: Idea) => {
    setEditAction(idea.action)
    setEditSummary(idea.summary || '')
    setEditThesis(idea.thesis || '')
    setEditConfidence(idea.confidence || 'MEDIUM')
    setIsEditingIdea(true)
  }

  const [selectedCompany, setSelectedCompany] = useState('')
  const [action, setAction] = useState('BUY')
  const [summary, setSummary] = useState('')
  const [confidence, setConfidence] = useState('MEDIUM')

  const documentId = Number(id)

  useEffect(() => {
    if (!id) return
    documentsApi.getById(documentId).then(res => setDocument(res.data))
    ideasApi.getAll({ documentId }).then(res => setIdeas(res.data))
    companiesApi.getAll().then(res => setCompanies(res.data))
  }, [id])

  const handleAddIdea = async () => {
    if (!selectedCompany) return
    await ideasApi.create({
      documentId,
      companyId: Number(selectedCompany),
      action,
      summary: summary || undefined,
      confidence: confidence || undefined,
    })
    ideasApi.getAll({ documentId }).then(res => setIdeas(res.data))
    setShowAddIdea(false)
    setSelectedCompany('')
    setAction('BUY')
    setSummary('')
    setConfidence('MEDIUM')
  }

  const handleDeleteIdea = async (ideaId: number) => {
    if (!confirm('Delete this idea?')) return
    await ideasApi.delete(ideaId)
    setIdeas(ideas.filter(i => i.id !== ideaId))
    if (selectedIdea?.id === ideaId) { setSelectedIdea(null); setDragX(0); setIsEditingIdea(false) }
  }

  const openCatPicker = async () => {
    if (!selectedIdea) return
    setCatSearch('')
    setCatSaving(false)
    const [allRes, myRes] = await Promise.all([
      categoriesApi.getAll(),
      categoriesApi.getByIdeaId(selectedIdea.id),
    ])
    setCategories(allRes.data)
    const myIds = new Set(myRes.data.map((c: Category) => c.id))
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
    if (!selectedIdea) return
    setCatSaving(true)
    const toAdd = [...catChecked].filter(id => !catOriginal.has(id))
    const toRemove = [...catOriginal].filter(id => !catChecked.has(id))
    await Promise.all([
      ...toAdd.map(catId => categoriesApi.addIdeas(catId, [selectedIdea.id])),
      ...toRemove.map(catId => categoriesApi.removeIdea(catId, selectedIdea.id)),
    ])
    setCatSaving(false)
    setShowCatPicker(false)
  }

  const handleUpdateIdea = async () => {
    if (!selectedIdea) return
    const res = await ideasApi.update(selectedIdea.id, {
      action: editAction as any,
      summary: editSummary,
      thesis: editThesis,
      confidence: editConfidence,
    })
    const updated = res.data
    setIdeas(ideas.map(i => i.id === updated.id ? updated : i))
    setSelectedIdea(updated)
    setIsEditingIdea(false)
  }

  const handleImport = async () => {
    setImportError('')
    let parsed: unknown
    try {
      parsed = JSON.parse(importJson)
    } catch {
      setImportError('Invalid JSON — please check the format.')
      return
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      setImportError('JSON must be a non-empty array.')
      return
    }
    setImporting(true)
    try {
      await ideasApi.importJson(documentId, parsed as any)
      const res = await ideasApi.getAll({ documentId })
      setIdeas(res.data)
      setShowImport(false)
      setImportJson('')
    } catch (e: any) {
      setImportError(e?.response?.data?.error ?? 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

  if (!document) {
    return <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Link to="/documents" className="back-link">← Back to Documents</Link>

      <div className="doc-detail-layout">
        {/* PDF Viewer */}
        <div className="pdf-viewer">
          <div className="pdf-toolbar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
            <span>{document.fileName}</span>
          </div>
          <iframe
            src={documentsApi.getFileUrl(document.id)}
            className="pdf-frame"
            title="PDF Viewer"
          />
        </div>

        {/* Right Panel */}
        <div className="doc-sidebar">
          {/* Document Info */}
          <div className="card">
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>{document.title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              {document.source && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Source</span>
                  <span style={{ fontWeight: 500 }}>{document.source}</span>
                </div>
              )}
              {document.period && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Period</span>
                  <span style={{ fontWeight: 500 }}>{document.period}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Uploaded</span>
                <span style={{ fontWeight: 500 }}>{new Date(document.uploadTime).toLocaleDateString()}</span>
              </div>
            </div>
            {document.notes && (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
                {document.notes}
              </p>
            )}
          </div>

          {/* Ideas Section */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Ideas & Viewpoints</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { setShowImport(true); setShowAddIdea(false) }}>⬇ Import JSON</button>
                <button className="btn btn-primary btn-sm" onClick={() => { setShowAddIdea(true); setShowImport(false) }}>+ Add</button>
              </div>
            </div>

            {showImport && (
              <div className="modal-overlay" onClick={() => { setShowImport(false); setImportError('') }}>
                <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                  <div className="modal-title">Import Ideas (JSON)</div>
                  <div className="form-group">
                    <span className="form-label">Paste a JSON array of ideas for this document</span>
                    <textarea
                      className="textarea"
                      value={importJson}
                      onChange={e => { setImportJson(e.target.value); setImportError('') }}
                      placeholder={IMPORT_PLACEHOLDER}
                      rows={12}
                      style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12px' }}
                    />
                  </div>
                  {importError && (
                    <p style={{ fontSize: '12px', color: 'var(--danger)' }}>{importError}</p>
                  )}
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={() => { setShowImport(false); setImportError('') }}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleImport} disabled={importing || !importJson.trim()}>
                      {importing ? 'Importing…' : 'Import'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showAddIdea && (
              <div className="add-idea-form">
                <div className="form-group">
                  <span className="form-label">Company *</span>
                  <select className="select" value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}>
                    <option value="">Select company...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.ticker && `(${c.ticker})`}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <span className="form-label">Action</span>
                    <select className="select" value={action} onChange={e => setAction(e.target.value)}>
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                      <option value="HOLD">HOLD</option>
                      <option value="LONG">LONG</option>
                      <option value="SHORT">SHORT</option>
                      <option value="MONITOR">MONITOR</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <span className="form-label">Confidence</span>
                    <select className="select" value={confidence} onChange={e => setConfidence(e.target.value)}>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <span className="form-label">Summary</span>
                  <textarea className="textarea" value={summary} onChange={e => setSummary(e.target.value)} placeholder="Key viewpoint or thesis..." rows={2} />
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowAddIdea(false)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={handleAddIdea} disabled={!selectedCompany}>Save</button>
                </div>
              </div>
            )}

            {ideas.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                No ideas yet. Click "Add" to associate companies and viewpoints.
              </p>
            ) : (
              <div className="idea-list">
                {ideas.map(idea => (
                  <div key={idea.id} className="idea-item" style={{ cursor: 'pointer' }} onClick={() => setSelectedIdea(idea)}>
                    <ActionBadge action={idea.action} />
                    <div className="idea-content">
                      <div className="idea-company">
                        {idea.companyName} {idea.companyTicker && <span style={{ color: 'var(--text-muted)' }}>({idea.companyTicker})</span>}
                      </div>
                      {idea.summary && <div className="idea-summary">{idea.summary}</div>}
                      {idea.confidence && <div className="idea-meta">Confidence: {idea.confidence}</div>}
                    </div>
                    <button className="btn-ghost btn-danger" onClick={e => { e.stopPropagation(); handleDeleteIdea(idea.id) }} title="Delete">🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Idea Reading Modal */}
      {selectedIdea && (() => {
        const idx = ideas.findIndex(i => i.id === selectedIdea.id)
        const hasPrev = idx > 0
        const hasNext = idx < ideas.length - 1
        const navigate = (idea: Idea) => { setSelectedIdea(idea); setIsEditingIdea(false) }
        return (
          <div className="modal-overlay" onClick={() => { setSelectedIdea(null); setDragX(0); setIsEditingIdea(false) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={e => e.stopPropagation()}>
              {/* Prev button */}
              <button
                onClick={() => hasPrev && navigate(ideas[idx - 1])}
                style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-secondary)', fontSize: '22px', cursor: hasPrev ? 'pointer' : 'default', opacity: isEditingIdea ? 0 : (hasPrev ? 1 : 0.25), flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', pointerEvents: isEditingIdea ? 'none' : 'auto' }}
              >‹</button>

              {/* Modal card */}
              <div
                className="modal"
                style={{ maxWidth: 680, width: '70vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', transform: `translateX(${dragX}px) rotate(${dragX * 0.012}deg)`, transition: isDragging.current ? 'none' : 'transform 0.25s ease', cursor: isEditingIdea ? 'default' : (isDragging.current ? 'grabbing' : 'grab'), userSelect: 'none' }}
                onMouseDown={isEditingIdea ? undefined : e => onSwipeStart(e.clientX, e.clientY)}
                onMouseMove={isEditingIdea ? undefined : e => onSwipeMove(e.clientX, e.clientY)}
                onMouseUp={isEditingIdea ? undefined : () => onSwipeEnd(idx)}
                onMouseLeave={isEditingIdea ? undefined : () => { if (isDragging.current) onSwipeEnd(idx) }}
                onTouchStart={isEditingIdea ? undefined : e => onSwipeStart(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={isEditingIdea ? undefined : e => onSwipeMove(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={isEditingIdea ? undefined : () => onSwipeEnd(idx)}
              >
                {/* Sticky header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                  {isEditingIdea ? (
                    <>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Editing idea</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setIsEditingIdea(false)}>Cancel</button>
                        <button className="btn btn-primary btn-sm" onClick={handleUpdateIdea}>Save</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ActionBadge action={selectedIdea.action} />
                        {selectedIdea.confidence && (
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                            {selectedIdea.confidence}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{idx + 1} / {ideas.length}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => startEditingIdea(selectedIdea)}>✏️ Edit</button>
                        <button className="btn btn-ghost btn-sm" onClick={openCatPicker} title="Add to category">🗂️</button>
                        <button className="btn btn-ghost" onClick={() => { setSelectedIdea(null); setDragX(0) }} style={{ fontSize: '16px', lineHeight: 1 }}>✕</button>
                      </div>
                    </>
                  )}
                </div>

                {/* Swipe hint */}
                {dragX !== 0 && (
                  <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: dragX > 0 ? 16 : 'auto', right: dragX < 0 ? 16 : 'auto', fontSize: '28px', opacity: Math.min(Math.abs(dragX) / 80, 1), pointerEvents: 'none' }}>
                    {dragX > 0 ? '⬅️' : '➡️'}
                  </div>
                )}

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px' }}>
                  {isEditingIdea ? (
                    // Edit mode
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', userSelect: 'text' }} onMouseDown={e => e.stopPropagation()}>
                      <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                        {selectedIdea.companyName}
                        {selectedIdea.companyTicker && <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '8px' }}>({selectedIdea.companyTicker})</span>}
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
                            <option value="HIGH">HIGH</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="LOW">LOW</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <span className="form-label">Summary</span>
                        <textarea className="textarea" value={editSummary} onChange={e => setEditSummary(e.target.value)} rows={3} placeholder="Brief viewpoint..." />
                      </div>
                      <div className="form-group">
                        <span className="form-label">Thesis</span>
                        <textarea className="textarea" value={editThesis} onChange={e => setEditThesis(e.target.value)} rows={8} placeholder="Full investment thesis..." style={{ fontFamily: 'inherit', lineHeight: '1.7' }} />
                      </div>
                    </div>
                  ) : (
                    // Read mode
                    <>
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '22px', fontWeight: 700 }}>{selectedIdea.companyName}</div>
                        {selectedIdea.companyTicker && (
                          <span className="badge-ticker" style={{ marginTop: '4px', display: 'inline-block' }}>{selectedIdea.companyTicker}</span>
                        )}
                      </div>
                      {selectedIdea.summary && (
                        <div style={{ marginBottom: '20px' }}>
                          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Summary</p>
                          <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)' }}>{selectedIdea.summary}</p>
                        </div>
                      )}
                      {selectedIdea.thesis && (
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Thesis</p>
                          <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{selectedIdea.thesis}</p>
                        </div>
                      )}
                      {!selectedIdea.summary && !selectedIdea.thesis && (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No content recorded for this idea.</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Next button */}
              <button
                onClick={() => hasNext && navigate(ideas[idx + 1])}
                style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-secondary)', fontSize: '22px', cursor: hasNext ? 'pointer' : 'default', opacity: isEditingIdea ? 0 : (hasNext ? 1 : 0.25), flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', pointerEvents: isEditingIdea ? 'none' : 'auto' }}
              >›</button>
            </div>
          </div>
        )
      })()}

      {/* Category Picker */}
      {showCatPicker && selectedIdea && (
        <div className="modal-overlay" onClick={() => setShowCatPicker(false)}>
          <div className="modal" style={{ maxWidth: 420, width: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <h2 className="modal-title">Manage Categories</h2>
              <button className="btn btn-ghost" onClick={() => setShowCatPicker(false)} style={{ fontSize: '16px' }}>✕</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              <strong>{selectedIdea.companyName}</strong> — check to include, uncheck to remove
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
