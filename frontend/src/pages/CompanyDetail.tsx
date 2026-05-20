import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { companiesApi, ideasApi } from '../lib/api'
import type { Company, Idea } from '../lib/api'

function ActionBadge({ action }: { action: string }) {
  return <span className={`badge badge-${action.toLowerCase()}`}>{action}</span>
}

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>()
  const [company, setCompany] = useState<Company | null>(null)
  const [ideas, setIdeas] = useState<Idea[]>([])

  useEffect(() => {
    if (!id) return
    const companyId = Number(id)
    companiesApi.getById(companyId).then(res => setCompany(res.data))
    ideasApi.getAll({ companyId }).then(res => setIdeas(res.data))
  }, [id])

  if (!company) {
    return <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
  }

  const ideasByDocument = ideas.reduce((acc, idea) => {
    const key = idea.documentId
    if (!acc[key]) acc[key] = { title: idea.documentTitle, ideas: [] }
    acc[key].ideas.push(idea)
    return acc
  }, {} as Record<number, { title: string; ideas: Idea[] }>)

  return (
    <div>
      <Link to="/companies" className="back-link">← Back to Companies</Link>

      <div className="company-header">
        <h1>{company.name}</h1>
        <div className="company-header-meta">
          {company.ticker && <span className="badge-ticker">{company.ticker}</span>}
          {company.sector && <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{company.sector}</span>}
        </div>
        {company.description && (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '12px' }}>{company.description}</p>
        )}
        <div className="company-header-stats">
          <strong>{ideas.length}</strong> ideas across <strong>{Object.keys(ideasByDocument).length}</strong> documents
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        {Object.keys(ideasByDocument).length === 0 ? (
          <div className="empty-state">
            <p>No ideas associated with this company yet.</p>
            <p style={{ marginTop: '4px', fontSize: '13px' }}>Add ideas from the document detail page.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 className="section-title">Ideas by Document</h2>
            {Object.entries(ideasByDocument).map(([docId, { title, ideas: docIdeas }]) => (
              <div key={docId} className="doc-group">
                <Link to={`/documents/${docId}`} className="doc-group-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                  {title}
                </Link>
                <div className="doc-group-ideas">
                  {docIdeas.map(idea => (
                    <div key={idea.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <ActionBadge action={idea.action} />
                      <div>
                        {idea.summary && <p style={{ fontSize: '13px' }}>{idea.summary}</p>}
                        <span className="idea-meta">
                          {idea.confidence && `${idea.confidence} confidence · `}
                          {new Date(idea.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
