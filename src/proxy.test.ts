import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { proxy } from './proxy'

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      rewrite: vi.fn((url: URL) => ({ type: 'rewrite', url: url.toString() })),
      redirect: vi.fn((url: URL) => ({ type: 'redirect', url: url.toString() })),
      next: vi.fn(() => ({ type: 'next' })),
    },
  }
})

function makeRequest(pathname: string, options: { hasCookie?: boolean } = {}) {
  const req = new NextRequest(`https://app.test${pathname}`)
  if (options.hasCookie) {
    req.cookies.set('refresh_token', 'tok')
  }
  return req
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('proxy — auth guard', () => {
  it('redirects to /login when no refresh_token and path is protected', () => {
    proxy(makeRequest('/dashboard'))
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' }),
    )
  })

  it('redirects to /dashboard when refresh_token present and path is /login', () => {
    proxy(makeRequest('/login', { hasCookie: true }))
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/dashboard' }),
    )
  })

  it('allows unauthenticated access to /register', () => {
    proxy(makeRequest('/register'))
    expect(NextResponse.redirect).not.toHaveBeenCalled()
    expect(NextResponse.next).toHaveBeenCalled()
  })

  it('allows unauthenticated access to /forgot-password', () => {
    proxy(makeRequest('/forgot-password'))
    expect(NextResponse.redirect).not.toHaveBeenCalled()
    expect(NextResponse.next).toHaveBeenCalled()
  })

  it('allows authenticated access to protected pages', () => {
    proxy(makeRequest('/dashboard', { hasCookie: true }))
    expect(NextResponse.redirect).not.toHaveBeenCalled()
    expect(NextResponse.next).toHaveBeenCalled()
  })
})
