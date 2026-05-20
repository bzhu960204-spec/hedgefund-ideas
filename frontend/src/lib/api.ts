import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export interface Document {
  id: number
  title: string
  source: string | null
  period: string | null
  filePath: string
  fileName: string
  fileSize: number
  notes: string | null
  uploadTime: string
}

export interface Company {
  id: number
  name: string
  ticker: string | null
  sector: string | null
  description: string | null
}

export interface Idea {
  id: number
  documentId: number
  documentTitle: string
  companyId: number
  companyName: string
  companyTicker: string | null
  action: 'BUY' | 'SELL' | 'HOLD' | 'LONG' | 'SHORT' | 'MONITOR'
  summary: string | null
  thesis: string | null
  confidence: string | null
  createdAt: string
}

export interface DashboardStats {
  documents: number
  companies: number
  ideas: number
}

// Documents API
export const documentsApi = {
  getAll: (search?: string) =>
    api.get<Document[]>('/documents', { params: { search } }),
  getById: (id: number) =>
    api.get<Document>(`/documents/${id}`),
  upload: (formData: FormData) =>
    api.post<Document>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: number, data: Partial<Document>) =>
    api.put<Document>(`/documents/${id}`, data),
  delete: (id: number) =>
    api.delete(`/documents/${id}`),
  getFileUrl: (id: number) => `/api/documents/${id}/file`,
}

// Companies API
export const companiesApi = {
  getAll: (search?: string) =>
    api.get<Company[]>('/companies', { params: { search } }),
  getById: (id: number) =>
    api.get<Company>(`/companies/${id}`),
  create: (data: Partial<Company>) =>
    api.post<Company>('/companies', data),
  update: (id: number, data: Partial<Company>) =>
    api.put<Company>(`/companies/${id}`, data),
  delete: (id: number) =>
    api.delete(`/companies/${id}`),
}

export interface IdeaImportItem {
  companyId?: number
  companyTicker?: string
  companyName?: string
  action: string
  summary?: string
  thesis?: string
  confidence?: string
}

// Ideas API
export const ideasApi = {
  getAll: (params?: { documentId?: number; companyId?: number }) =>
    api.get<Idea[]>('/ideas', { params }),
  create: (data: { documentId: number; companyId: number; action: string; summary?: string; confidence?: string }) =>
    api.post<Idea>('/ideas', data),
  update: (id: number, data: Partial<Idea>) =>
    api.put<Idea>(`/ideas/${id}`, data),
  delete: (id: number) =>
    api.delete(`/ideas/${id}`),
  importJson: (documentId: number, items: IdeaImportItem[]) =>
    api.post<Idea[]>('/ideas/import', items, { params: { documentId } }),
}

// Dashboard API
export const dashboardApi = {
  getStats: () =>
    api.get<DashboardStats>('/dashboard/stats'),
}

export default api
