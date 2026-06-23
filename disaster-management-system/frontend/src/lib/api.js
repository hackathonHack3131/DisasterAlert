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
  verifyLogin: (email, otp) => api.post('/api/auth/verify-login', { email, otp }),
  resendOtp: (email) => api.post('/api/auth/resend-otp', { email }),
}

export const orgApi = {
  register: (data) => api.post('/api/org/auth/register', data),
  verifyOtp: (email, otp) => api.post('/api/org/auth/verify-otp', { email, otp }),
  login: (email, password) => api.post('/api/org/auth/login', { email, password }),
  verifyLogin: (email, otp) => api.post('/api/org/auth/verify-login', { email, otp }),
  resendOtp: (email) => api.post('/api/org/auth/resend-otp', { email }),
  updateProfile: (data) => api.put('/api/org/profile', data),
}

export const eventsApi = {
  active: () => api.get('/api/events/active'),
  simulate: (data) => api.post('/api/events/simulate', data),
}

export const simulateApi = {
  flood:      (data) => api.post('/api/simulate/flood',      data),
  fire:       (data) => api.post('/api/simulate/fire',       data),
  earthquake: (data) => api.post('/api/simulate/earthquake', data),
  cyclone:    (data) => api.post('/api/simulate/cyclone',    data),
  landslide:  (data) => api.post('/api/simulate/landslide',  data),
  disaster:   (data) => api.post('/api/simulate/disaster',   data),
  active:     ()     => api.get('/api/simulate/active'),
  resolve:    (id)   => api.patch(`/api/simulate/resolve/${id}`),
}

export const publicApi = {
  organisations: () => api.get('/api/public/organisations'),
  stats: () => api.get('/api/public/stats'),
  alerts: () => api.get('/api/public/alerts'),
  events: () => api.get('/api/public/events'),
  shelters: () => api.get('/api/public/shelters'),
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
