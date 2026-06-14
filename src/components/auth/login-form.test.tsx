import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginForm } from './login-form'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ signIn: vi.fn() }),
}))

vi.mock('@/lib/api/auth', () => ({
  authApi: { login: vi.fn() },
}))

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const { authApi } = await import('@/lib/api/auth')

function wrap(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('LoginForm', () => {
  beforeEach(() => vi.clearAllMocks())

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
    vi.mocked(authApi.login).mockResolvedValueOnce({
      accessToken: 'tok',
      expiresIn: 900,
    })
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
})
