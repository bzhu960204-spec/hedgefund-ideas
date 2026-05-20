import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi, documentsApi, ideasApi } from '../lib/api'
import type { Document, Idea, DashboardStats } from '../lib/api'

function ActionBadge({ action }: { action: string }) {
  return <span className={`badge badge-${action.toLowerCase()}`}>{action}</span>
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({ documents: 0, companies: 0, ideas: 0 })
  const [recentDocs, setRecentDocs] = useState<Document[]>([])
  const [recentIdeas, setRecentIdeas] = useState<Idea[]>([])

  useEffect(() => {
    dashboardApi.getStats().then(res => setStats(res.data)).catch(() => {})
    documentsApi.getAll().then(res => setRecentDocs(res.data.slice(0, 5))).catch(() => {})
    ideasApi.getAll().then(res => setRecentIdeas(res.data.slice(0, 5))).catch(() => {})
  }, [])

  return (
    <div>
      <div className="mb-24">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your investment research</p>
      </div>

      <div className="stats-grid mb-24">
        <div className="stat-card">
          <div className="stat-icon blue">📄</div>
          <div>
            <div className="stat-value">{stats.documents}</div>
            <div className="stat-label">Documents</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🏢</div>
          <div>
            <div className="stat-value">{stats.companies}</div>
            <div className="stat-label">Companies</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">💡</div>
          <div>
            <div className="stat-value">{stats.ideas}</div>
            <div className="stat-label">Ideas</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Documents</span>
            <Link to="/documents" className="text-link">View all</Link>
          </div>
          {recentDocs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No documents yet. Upload your first investor letter!</p>
          ) : (
            <div className="idea-list">
              {recentDocs.map(doc => (
                <Link key={doc.id} to={`/documents/${doc.id}`} className="idea-item">
                  <span>📄</span>
                  <div className="idea-content">
                    <div className="idea-company">{doc.title}</div>
                    <div className="idea-summary">{doc.source} · {doc.period}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Ideas</span>
          </div>
          {recentIdeas.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No ideas yet. Add ideas from document details page.</p>
          ) : (
            <div className="idea-list">
              {recentIdeas.map(idea => (
                <div key={idea.id} className="idea-item">
                  <ActionBadge action={idea.action} />
                  <div className="idea-content">
                    <div className="idea-company">
                      {idea.companyName} {idea.companyTicker && <span style={{ color: 'var(--text-muted)' }}>({idea.companyTicker})</span>}
                    </div>
                    <div className="idea-summary">{idea.summary || idea.documentTitle}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
