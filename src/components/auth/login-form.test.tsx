import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginForm } from './login-form'

const mockLocationHref = vi.fn()
Object.defineProperty(window, 'location', {
  value: { set href(v: string) { mockLocationHref(v) } },
  writable: false,
})

vi.mock('@/providers/auth-provider', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/api/auth', () => ({
  authApi: { login: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const { useAuth } = await import('@/providers/auth-provider')
const { authApi } = await import('@/lib/api/auth')
const { toast } = await import('sonner')

const mockSignIn = vi.fn()

function wrap(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      signIn: mockSignIn,
      user: null,
      isLoading: false,
      signOut: vi.fn(),
    })
  })

  it('renders email, password inputs and submit button', () => {
    wrap(<LoginForm />)
    expect(screen.getByLabelText(/email/i)).toBeDefined()
    expect(screen.getByLabelText(/^senha$/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeDefined()
  })

  it('shows validation error for invalid email', async () => {
    wrap(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email')
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'anypassword')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeDefined()
    })
  })

  it('calls authApi.login with correct values on valid submit', async () => {
    vi.mocked(authApi.login).mockResolvedValueOnce({ accessToken: 'tok', expiresIn: 900 })
    wrap(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com')
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => {
      expect(vi.mocked(authApi.login).mock.calls[0][0]).toEqual({
        email: 'user@test.com',
        password: 'password123',
      })
    })
  })

  it('calls signIn and navigates to /dashboard on success', async () => {
    vi.mocked(authApi.login).mockResolvedValueOnce({ accessToken: 'tok', expiresIn: 900 })
    wrap(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com')
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({ accessToken: 'tok', expiresIn: 900 })
      expect(mockLocationHref).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows "Entrando..." while request is pending', async () => {
    vi.mocked(authApi.login).mockReturnValue(new Promise(() => {}))
    wrap(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com')
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrando/i })).toBeDefined()
    })
  })

  it('shows "Email ou senha incorretos" on 401', async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce({ response: { status: 401 } })
    wrap(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com')
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Email ou senha incorretos')
    })
  })

  it('shows verify email message on 403 email-not-verified', async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce({
      response: { status: 403, data: { type: 'email-not-verified' } },
    })
    wrap(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com')
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        'Confirme seu email antes de fazer login',
      )
    })
  })

  it('shows generic error on unexpected failure', async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce({ response: { status: 500 } })
    wrap(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com')
    await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        'Erro ao fazer login. Tente novamente.',
      )
    })
  })
})
