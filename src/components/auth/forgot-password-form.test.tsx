import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ForgotPasswordForm } from './forgot-password-form'

vi.mock('@/lib/api/auth', () => ({
  authApi: { forgotPassword: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const { authApi } = await import('@/lib/api/auth')

function wrap(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('ForgotPasswordForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders email input and submit button', () => {
    wrap(<ForgotPasswordForm />)
    expect(screen.getByLabelText(/email/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /enviar/i })).toBeDefined()
  })

  it('shows validation error for invalid email', async () => {
    wrap(<ForgotPasswordForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'invalid')
    await userEvent.click(screen.getByRole('button', { name: /enviar/i }))
    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeDefined()
    })
  })

  it('shows success state after submission', async () => {
    vi.mocked(authApi.forgotPassword).mockResolvedValueOnce(undefined)
    wrap(<ForgotPasswordForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com')
    await userEvent.click(screen.getByRole('button', { name: /enviar/i }))
    await waitFor(() => {
      expect(screen.getByText(/email enviado/i)).toBeDefined()
    })
  })
})
