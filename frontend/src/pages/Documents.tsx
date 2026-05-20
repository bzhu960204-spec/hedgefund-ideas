import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { documentsApi } from '../lib/api'
import type { Document } from '../lib/api'

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [search, setSearch] = useState('')
  const [fromYear, setFromYear] = useState('')
  const [fromQuarter, setFromQuarter] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadSource, setUploadSource] = useState('')
  const [uploadYear, setUploadYear] = useState('')
  const [uploadQuarter, setUploadQuarter] = useState('')
  const [uploadNotes, setUploadNotes] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const loadDocuments = () => {
    documentsApi.getAll(search || undefined).then(res => setDocuments(res.data)).catch(() => {})
  }

  useEffect(() => {
    loadDocuments()
  }, [search])

  const pickFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are supported.')
      return
    }
    setSelectedFile(file)
    const baseName = file.name.replace(/\.pdf$/i, '')
    // Parse "2025Q4 - Saga Partners" → year=2025, quarter=4
    const periodMatch = baseName.match(/^(\d{4})Q([1-4])/i)
    if (periodMatch) {
      if (!uploadYear) setUploadYear(periodMatch[1])
      if (!uploadQuarter) setUploadQuarter(periodMatch[2])
    }
    // Parse "2025Q4 - Saga Partners" → source="Saga Partners"
    const sourceMatch = baseName.match(/^.+?\s+-\s+(.+)$/)
    if (sourceMatch && !uploadSource) setUploadSource(sourceMatch[1].trim())
    if (!uploadTitle) setUploadTitle(baseName)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) pickFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (uploadTitle) formData.append('title', uploadTitle)
      if (uploadSource) formData.append('source', uploadSource)
      if (uploadYear) formData.append('periodYear', uploadYear)
      if (uploadQuarter) formData.append('periodQuarter', uploadQuarter)
      if (uploadNotes) formData.append('notes', uploadNotes)
      await documentsApi.upload(formData)
      setShowUpload(false)
      setSelectedFile(null)
      setUploadTitle('')
      setUploadSource('')
      setUploadYear('')
      setUploadQuarter('')
      setUploadNotes('')
      loadDocuments()
    } catch {
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    await documentsApi.delete(id)
    loadDocuments()
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const parseLegacyPeriod = (period: string | null | undefined): { year: number; quarter: number } | null => {
    if (!period) return null
    const m = period.match(/^(\d{4})\s*Q([1-4])$/i)
    if (m) return { year: Number(m[1]), quarter: Number(m[2]) }
    return null
  }

  const filteredDocs = documents.filter(doc => {
    if (!fromYear && !fromQuarter) return true
    const fy = fromYear ? Number(fromYear) : null
    const fq = fromQuarter ? Number(fromQuarter) : null
    // Use structured fields; fall back to parsing the legacy period string
    const legacy = parseLegacyPeriod(doc.period)
    const dy = doc.periodYear ?? legacy?.year ?? 0
    const dq = doc.periodQuarter ?? legacy?.quarter ?? 0
    if (fy !== null && fq !== null) {
      return dy > fy || (dy === fy && dq >= fq)
    } else if (fy !== null) {
      return dy >= fy
    } else {
      return dq >= (fq ?? 0)
    }
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">Manage your investor letters and research reports</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
          ⬆️ Upload Document
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="input-with-icon" style={{ flex: 1, minWidth: '180px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            className="input"
            type="text"
            placeholder="Search by title or source..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>From:</span>
        <input
          className="input"
          type="number"
          placeholder="Year"
          value={fromYear}
          onChange={e => setFromYear(e.target.value)}
          style={{ width: '100px' }}
          min="2000" max="2099"
        />
        <select className="select" style={{ width: 'auto' }} value={fromQuarter} onChange={e => setFromQuarter(e.target.value)}>
          <option value="">Any Q</option>
          <option value="1">Q1</option>
          <option value="2">Q2</option>
          <option value="3">Q3</option>
          <option value="4">Q4</option>
        </select>
        {(fromYear || fromQuarter) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFromYear(''); setFromQuarter('') }}>✕ Clear</button>
        )}
      </div>

      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Upload Document</h2>

            <div className="form-group">
              <span className="form-label">PDF File *</span>
              <div
                className={`file-drop${dragOver ? ' file-drop-active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <p className="selected">📄 {selectedFile.name}</p>
                ) : (
                  <>
                    <p>拖拽 PDF 文件到此处，或点击选择文件</p>
                    <p style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-muted)' }}>仅支持 .pdf 格式</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) pickFile(file)
                }}
              />
            </div>

            <div className="form-group">
              <span className="form-label">Title</span>
              <input className="input" type="text" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="e.g. 2026Q1 - Oakmark Fund" />
            </div>

            <div className="form-row form-row-2">
              <div className="form-group">
                <span className="form-label">Source / Fund</span>
                <input className="input" type="text" value={uploadSource} onChange={e => setUploadSource(e.target.value)} placeholder="e.g. Oakmark" />
              </div>
              <div className="form-group">
                <span className="form-label">Year</span>
                <input className="input" type="number" value={uploadYear} onChange={e => setUploadYear(e.target.value)} placeholder="e.g. 2025" min="2000" max="2099" />
              </div>
            </div>

            <div className="form-group">
              <span className="form-label">Quarter</span>
              <select className="select" value={uploadQuarter} onChange={e => setUploadQuarter(e.target.value)}>
                <option value="">— Select Quarter —</option>
                <option value="1">Q1</option>
                <option value="2">Q2</option>
                <option value="3">Q3</option>
                <option value="4">Q4</option>
              </select>
            </div>

            <div className="form-group">
              <span className="form-label">Notes</span>
              <textarea className="textarea" value={uploadNotes} onChange={e => setUploadNotes(e.target.value)} placeholder="Optional notes..." rows={2} />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={!selectedFile || uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
          <p>No documents yet</p>
          <p style={{ marginTop: '4px', fontSize: '13px' }}>Upload your first investor letter to get started</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
          <p>No reports match the selected period filter</p>
        </div>
      ) : (
        <div className="doc-list">
          {filteredDocs.map(doc => (
            <Link key={doc.id} to={`/documents/${doc.id}`} className="doc-item">
              <div className="doc-icon">📄</div>
              <div className="doc-info">
                <div className="doc-title">{doc.title}</div>
                <div className="doc-meta">
                  {doc.source && <span>🏢 {doc.source}</span>}
                  {(doc.periodYear || doc.period) && (
                    <span>📅 {(() => {
                      if (doc.periodYear) return `${doc.periodYear} Q${doc.periodQuarter ?? '?'}`
                      const p = parseLegacyPeriod(doc.period)
                      return p ? `${p.year} Q${p.quarter}` : doc.period
                    })()}</span>
                  )}
                  <span>{formatSize(doc.fileSize)}</span>
                </div>
              </div>
              <button
                className="btn-ghost btn-danger doc-delete"
                onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(doc.id) }}
                title="Delete"
              >
                🗑️
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
