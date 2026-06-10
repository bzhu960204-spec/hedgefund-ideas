import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

const TOKEN_KEY = 'hf_auth_token'
const USER_KEY = 'hf_auth_user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export interface AuthUser {
  username: string
  role: string
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as AuthUser } catch { return null }
}

export function setStoredUser(user: AuthUser | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

api.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    config.headers = config.headers ?? {}
    ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
  }
  return config
})

let onUnauthorized: (() => void) | null = null
export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

api.interceptors.response.use(
  resp => resp,
  err => {
    if (err?.response?.status === 401) {
      setToken(null)
      setStoredUser(null)
      onUnauthorized?.()
    }
    return Promise.reject(err)
  }
)

export interface Document {
  id: number
  title: string
  source: string | null
  period: string | null
  periodYear: number | null
  periodQuarter: number | null
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
  action: 'BUY' | 'SELL' | 'HOLD' | 'MONITOR' | 'NONE'
  summary: string | null
  thesis: string | null
  confidence: string | null
  createdAt: string
  periodYear: number | null
  periodQuarter: number | null
}

export interface DashboardStats {
  documents: number
  companies: number
  ideas: number
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// Auth API
export interface LoginResponse {
  token: string
  username: string
  role: string
  expiresInMs: number
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { username, password }),
  register: (username: string, password: string) =>
    api.post('/auth/register', { username, password }),
  me: () =>
    api.get<AuthUser & { id: number }>('/auth/me'),
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
  getPaged: (params: { documentId?: number; companyId?: number; page: number; size?: number }) =>
    api.get<PagedResponse<Idea>>('/ideas', { params }),
  create: (data: { documentId: number; companyId: number; action: string; summary?: string; thesis?: string; confidence?: string }) =>
    api.post<Idea>('/ideas', data),
  update: (id: number, data: Partial<Idea>) =>
    api.put<Idea>(`/ideas/${id}`, data),
  delete: (id: number) =>
    api.delete(`/ideas/${id}`),
  importJson: (documentId: number, items: IdeaImportItem[]) =>
    api.post<Idea[]>('/ideas/import', items, { params: { documentId } }),
}

// Categories API
export interface Category {
  id: number
  name: string
  description: string | null
  ideaCount: number
  createdAt: string
}

export const categoriesApi = {
  getAll: () =>
    api.get<Category[]>('/categories'),
  getByIdeaId: (ideaId: number) =>
    api.get<Category[]>(`/categories/by-idea/${ideaId}`),
  getById: (id: number) =>
    api.get<Category>(`/categories/${id}`),
  getIdeas: (id: number) =>
    api.get<Idea[]>(`/categories/${id}/ideas`),
  create: (data: { name: string; description?: string }) =>
    api.post<Category>('/categories', data),
  update: (id: number, data: { name?: string; description?: string }) =>
    api.put<Category>(`/categories/${id}`, data),
  delete: (id: number) =>
    api.delete(`/categories/${id}`),
  addIdeas: (id: number, ideaIds: number[]) =>
    api.post<Category>(`/categories/${id}/ideas`, { ideaIds }),
  removeIdea: (categoryId: number, ideaId: number) =>
    api.delete<Category>(`/categories/${categoryId}/ideas/${ideaId}`),
}

// Dashboard API
export const dashboardApi = {
  getStats: () =>
    api.get<DashboardStats>('/dashboard/stats'),
}

export default api
