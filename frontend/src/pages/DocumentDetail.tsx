import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { documentsApi, ideasApi, companiesApi } from '../lib/api'
import type { Document, Idea, Company } from '../lib/api'

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
  const [companies, setCompanies] = useState<Company[]>([])
  const [showAddIdea, setShowAddIdea] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)

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
    await ideasApi.delete(ideaId)
    setIdeas(ideas.filter(i => i.id !== ideaId))
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
    <div>
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
                  <div key={idea.id} className="idea-item">
                    <ActionBadge action={idea.action} />
                    <div className="idea-content">
                      <Link to={`/companies/${idea.companyId}`} className="idea-company">
                        {idea.companyName} {idea.companyTicker && <span style={{ color: 'var(--text-muted)' }}>({idea.companyTicker})</span>}
                      </Link>
                      {idea.summary && <div className="idea-summary">{idea.summary}</div>}
                      {idea.confidence && <div className="idea-meta">Confidence: {idea.confidence}</div>}
                    </div>
                    <button className="btn-ghost btn-danger" onClick={() => handleDeleteIdea(idea.id)} title="Delete">🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
