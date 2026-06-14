import { apiClient } from './client'

export interface AuthResponse {
  accessToken: string
  expiresIn: number
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  phone: string
  birthDate: string
}

export interface LoginPayload {
  email: string
  password: string
}

export const authApi = {
  register: (data: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  refresh: () =>
    apiClient.post<AuthResponse>('/auth/refresh').then((r) => r.data),

  logout: () => apiClient.post('/auth/logout').then((r) => r.data),

  verifyEmail: (token: string) =>
    apiClient.get(`/auth/verify-email?token=${token}`).then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient
      .post('/auth/password/forgot', { email })
      .then((r) => r.data),

  resetPassword: (token: string, newPassword: string) =>
    apiClient
      .post('/auth/password/reset', { token, newPassword })
      .then((r) => r.data),
}
