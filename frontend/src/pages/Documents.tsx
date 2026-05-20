import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { documentsApi } from '../lib/api'
import type { Document } from '../lib/api'

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadSource, setUploadSource] = useState('')
  const [uploadPeriod, setUploadPeriod] = useState('')
  const [uploadNotes, setUploadNotes] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const loadDocuments = () => {
    documentsApi.getAll(search || undefined).then(res => setDocuments(res.data)).catch(() => {})
  }

  useEffect(() => {
    loadDocuments()
  }, [search])

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (uploadTitle) formData.append('title', uploadTitle)
      if (uploadSource) formData.append('source', uploadSource)
      if (uploadPeriod) formData.append('period', uploadPeriod)
      if (uploadNotes) formData.append('notes', uploadNotes)
      await documentsApi.upload(formData)
      setShowUpload(false)
      setSelectedFile(null)
      setUploadTitle('')
      setUploadSource('')
      setUploadPeriod('')
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

      <div className="input-with-icon" style={{ marginBottom: '24px' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          className="input"
          type="text"
          placeholder="Search by title or source..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Upload Document</h2>

            <div className="form-group">
              <span className="form-label">PDF File *</span>
              <div className="file-drop" onClick={() => fileInputRef.current?.click()}>
                <p className={selectedFile ? 'selected' : ''}>
                  {selectedFile ? selectedFile.name : 'Click to select a PDF file'}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setSelectedFile(file)
                    if (!uploadTitle) setUploadTitle(file.name.replace('.pdf', ''))
                  }
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
                <span className="form-label">Period</span>
                <input className="input" type="text" value={uploadPeriod} onChange={e => setUploadPeriod(e.target.value)} placeholder="e.g. 2026Q1" />
              </div>
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
      ) : (
        <div className="doc-list">
          {documents.map(doc => (
            <Link key={doc.id} to={`/documents/${doc.id}`} className="doc-item">
              <div className="doc-icon">📄</div>
              <div className="doc-info">
                <div className="doc-title">{doc.title}</div>
                <div className="doc-meta">
                  {doc.source && <span>🏢 {doc.source}</span>}
                  {doc.period && <span>📅 {doc.period}</span>}
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
