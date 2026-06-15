import axios from 'axios'
import { getToken, setToken } from './token'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let pendingRequests: Array<(token: string) => void> = []

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry || original.url?.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingRequests.push((token) => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(apiClient(original))
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      const newToken: string = data.accessToken
      setToken(newToken)
      pendingRequests.forEach((cb) => cb(newToken))
      pendingRequests = []
      original.headers.Authorization = `Bearer ${newToken}`
      return apiClient(original)
    } catch {
      setToken(null)
      pendingRequests = []
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)
