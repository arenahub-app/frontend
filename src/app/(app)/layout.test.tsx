import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AppLayout from '@/app/(app)/layout'

const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

vi.mock('@/providers/auth-provider', () => ({
  useAuth: vi.fn(),
}))

const { useAuth } = await import('@/providers/auth-provider')

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows spinner while loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    render(<AppLayout><div>content</div></AppLayout>)
    expect(screen.queryByText('content')).toBeNull()
    expect(document.querySelector('.animate-spin')).not.toBeNull()
  })

  it('redirects to /login when not loading and no user', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    render(<AppLayout><div>content</div></AppLayout>)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'))
    expect(screen.queryByText('content')).toBeNull()
  })

  it('renders children when user is authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u1', email: 'user@test.com', profileIncomplete: false },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    render(<AppLayout><div>content</div></AppLayout>)
    expect(screen.getByText('content')).toBeDefined()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('does not redirect while still loading even if user is null', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    render(<AppLayout><div>content</div></AppLayout>)
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
