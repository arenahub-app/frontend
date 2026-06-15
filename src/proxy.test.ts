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

function makeRequest(pathname: string, options: { hasCookie?: boolean; search?: string } = {}) {
  const url = `https://app.test${pathname}${options.search ?? ''}`
  const req = new NextRequest(url)
  if (options.hasCookie) {
    req.cookies.set('refresh_token', 'tok')
  }
  return req
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('proxy — API proxy', () => {
  it('rewrites /api/v1/* to BACKEND_URL when env is set', () => {
    process.env.BACKEND_URL = 'https://backend.test'
    proxy(makeRequest('/api/v1/auth/login'))
    expect(NextResponse.rewrite).toHaveBeenCalledWith(
      expect.objectContaining({ href: 'https://backend.test/api/v1/auth/login' }),
    )
  })

  it('preserves query string when rewriting', () => {
    process.env.BACKEND_URL = 'https://backend.test'
    proxy(makeRequest('/api/v1/users', { search: '?page=2' }))
    expect(NextResponse.rewrite).toHaveBeenCalledWith(
      expect.objectContaining({ href: 'https://backend.test/api/v1/users?page=2' }),
    )
  })

  it('falls through to next() when BACKEND_URL is not set', () => {
    delete process.env.BACKEND_URL
    proxy(makeRequest('/api/v1/auth/login', { hasCookie: true }))
    expect(NextResponse.rewrite).not.toHaveBeenCalled()
    expect(NextResponse.next).toHaveBeenCalled()
  })
})

describe('proxy — auth guard', () => {
  beforeEach(() => {
    delete process.env.BACKEND_URL
  })

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
})
