import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  verifyOtp: (email, otp) => api.post('/api/auth/verify-otp', { email, otp }),
  login: (username, password) => api.post('/api/auth/login', { username, password }),
}

export const orgApi = {
  register: (data) => api.post('/api/org/auth/register', data),
  verifyOtp: (email, otp) => api.post('/api/org/auth/verify-otp', { email, otp }),
  login: (email, password) => api.post('/api/org/auth/login', { email, password }),
  updateProfile: (data) => api.put('/api/org/profile', data),
}

export const eventsApi = {
  active: () => api.get('/api/events/active'),
  simulate: (data) => api.post('/api/events/simulate', data),
}

export const publicApi = {
  organisations: () => api.get('/api/public/organisations'),
  stats: () => api.get('/api/public/stats'),
  alerts: () => api.get('/api/public/alerts'),
}

export const shelterApi = {
  list: () => api.get('/api/shelters'),
  create: (data) => api.post('/api/shelters', data),
}

export const rescueApi = {
  request: (data) => api.post('/api/rescue/request', data),
  list: () => api.get('/api/rescue'),
  pending: () => api.get('/api/rescue/pending'),
  updateStatus: (id, status) => api.patch(`/api/rescue/${id}/status`, { status }),
}

export const climateApi = {
  intelligence: (lat = 19.076, lng = 72.8777, hourOffset = 0) =>
    api.get('/api/climate/intelligence', { params: { lat, lng, hourOffset } }),
}
