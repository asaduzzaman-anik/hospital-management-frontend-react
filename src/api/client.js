import axios from 'axios'
import { storage } from '../utils/storage'

const baseURL = import.meta.env.VITE_API_URL

if (!baseURL) {
  console.warn('VITE_API_URL is not set. Copy .env.example to .env.')
}

export const rawClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = storage.getAccess()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise = null

function isAuthUrl(url = '') {
  return url.includes('/auth/login/') || url.includes('/auth/refresh/')
}

client.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    if (status !== 401 || original?._retry || isAuthUrl(original?.url)) {
      return Promise.reject(error)
    }

    const refresh = storage.getRefresh()
    if (!refresh) {
      storage.clear()
      redirectToLogin()
      return Promise.reject(error)
    }

    original._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = rawClient
          .post('/auth/refresh/', { refresh })
          .then((res) => res.data)
          .finally(() => {
            refreshPromise = null
          })
      }

      const data = await refreshPromise
      storage.setAccess(data.access)
      original.headers.Authorization = `Bearer ${data.access}`
      return client(original)
    } catch (refreshError) {
      storage.clear()
      redirectToLogin()
      return Promise.reject(refreshError)
    }
  },
)

function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

export async function fetchAllPages(listFn, params = {}) {
  const items = []
  let page = 1
  while (page <= 100) {
    const data = await listFn({ ...params, page })
    items.push(...(data.results || []))
    if (!data.next) break
    page += 1
  }
  return items
}

export default client
