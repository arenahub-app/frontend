import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '@/providers/auth-provider'
import { authApi } from '@/lib/api/auth'
import * as tokenModule from '@/lib/api/token'

vi.mock('@/lib/api/auth', () => ({
  authApi: {
    refresh: vi.fn(),
    logout: vi.fn(),
  },
}))

function makeJwt(payload: object): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
  return `header.${encoded}.sig`
}

const ACCESS_TOKEN = makeJwt({
  sub: 'user-1',
  email: 'user@test.com',
  profileIncomplete: false,
})
const AUTH_RESPONSE = { accessToken: ACCESS_TOKEN, expiresIn: 900 }

function Consumer() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <span>loading</span>
  if (!user) return <span>no-user</span>
  return <span>user:{user.email}</span>
}

function wrap(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>)
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tokenModule.setToken(null)
  })

  it('starts in loading state before refresh resolves', () => {
    vi.mocked(authApi.refresh).mockReturnValue(new Promise(() => {}))
    wrap(<Consumer />)
    expect(screen.getByText('loading')).toBeDefined()
  })

  it('sets user and token when refresh succeeds', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue(AUTH_RESPONSE)
    wrap(<Consumer />)
    await waitFor(() => expect(screen.getByText('user:user@test.com')).toBeDefined())
    expect(tokenModule.getToken()).toBe(ACCESS_TOKEN)
  })

  it('clears state when refresh fails and no token is present', async () => {
    vi.mocked(authApi.refresh).mockRejectedValue(new Error('401'))
    wrap(<Consumer />)
    await waitFor(() => expect(screen.getByText('no-user')).toBeDefined())
    expect(tokenModule.getToken()).toBeNull()
  })

  it('does not overwrite user when refresh fails after signIn already ran', async () => {
    let capturedSignIn: ((data: typeof AUTH_RESPONSE) => void) | null = null
    let rejectRefresh!: (reason?: unknown) => void
    const refreshPromise = new Promise<typeof AUTH_RESPONSE>((_, rej) => {
      rejectRefresh = rej
    })
    vi.mocked(authApi.refresh).mockReturnValue(refreshPromise)

    function SignInCapture() {
      const { signIn, user } = useAuth()
      capturedSignIn = signIn
      if (user) return <span>user:{user.email}</span>
      return <span>no-user</span>
    }

    wrap(<SignInCapture />)
    await waitFor(() => screen.getByText('no-user'))

    act(() => capturedSignIn!(AUTH_RESPONSE))
    await waitFor(() => expect(screen.getByText('user:user@test.com')).toBeDefined())

    await act(async () => rejectRefresh(new Error('401')))

    expect(screen.getByText('user:user@test.com')).toBeDefined()
    expect(tokenModule.getToken()).toBe(ACCESS_TOKEN)
  })

  it('signIn sets user and token', async () => {
    vi.mocked(authApi.refresh).mockRejectedValue(new Error())

    function SignInButton() {
      const { signIn, user } = useAuth()
      if (user) return <span>user:{user.email}</span>
      return <button onClick={() => signIn(AUTH_RESPONSE)}>signin</button>
    }

    wrap(<SignInButton />)
    await waitFor(() => screen.getByRole('button', { name: 'signin' }))

    await userEvent.click(screen.getByRole('button', { name: 'signin' }))
    await waitFor(() => expect(screen.getByText('user:user@test.com')).toBeDefined())
    expect(tokenModule.getToken()).toBe(ACCESS_TOKEN)
  })

  it('signOut calls logout API and clears state', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue(AUTH_RESPONSE)
    vi.mocked(authApi.logout).mockResolvedValue(undefined)

    function SignOutButton() {
      const { signOut, user } = useAuth()
      if (user) return <button onClick={signOut}>signout</button>
      return <span>no-user</span>
    }

    wrap(<SignOutButton />)
    await waitFor(() => screen.getByRole('button', { name: 'signout' }))

    await userEvent.click(screen.getByRole('button', { name: 'signout' }))
    await waitFor(() => expect(screen.getByText('no-user')).toBeDefined())
    expect(vi.mocked(authApi.logout)).toHaveBeenCalled()
    expect(tokenModule.getToken()).toBeNull()
  })

  it('useAuth throws when used outside AuthProvider', () => {
    function BareConsumer() {
      useAuth()
      return null
    }
    expect(() => render(<BareConsumer />)).toThrow(
      'useAuth must be used inside AuthProvider',
    )
  })
})
