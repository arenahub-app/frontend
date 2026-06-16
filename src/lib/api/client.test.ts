import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import axios from 'axios'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { apiClient } from '@/lib/api/client'
import * as tokenModule from '@/lib/api/token'

const BASE = 'http://test.api'

const mockLocationHref = vi.fn()
Object.defineProperty(window, 'location', {
  value: { set href(v: string) { mockLocationHref(v) } },
  writable: false,
})

const server = setupServer()

beforeAll(() => {
  apiClient.defaults.baseURL = BASE
  server.listen({ onUnhandledRequest: 'bypass' })
})

afterAll(() => server.close())

afterEach(() => {
  server.resetHandlers()
  tokenModule.setToken(null)
  mockLocationHref.mockClear()
  vi.restoreAllMocks()
})

describe('request interceptor', () => {
  it('adds Authorization header when token is set', async () => {
    tokenModule.setToken('my-access-token')
    let received: string | null = null
    server.use(
      http.get(`${BASE}/protected`, ({ request }) => {
        received = request.headers.get('Authorization')
        return HttpResponse.json({})
      }),
    )
    await apiClient.get('/protected')
    expect(received).toBe('Bearer my-access-token')
  })

  it('omits Authorization header when no token', async () => {
    let received: string | null = 'present'
    server.use(
      http.get(`${BASE}/public`, ({ request }) => {
        received = request.headers.get('Authorization')
        return HttpResponse.json({})
      }),
    )
    await apiClient.get('/public')
    expect(received).toBeNull()
  })
})

describe('response interceptor', () => {
  it('passes through non-401 errors without retry', async () => {
    server.use(
      http.get(`${BASE}/forbidden`, () =>
        HttpResponse.json({ error: 'forbidden' }, { status: 403 }),
      ),
    )
    await expect(apiClient.get('/forbidden')).rejects.toMatchObject({
      response: { status: 403 },
    })
  })

  it('does not retry when /auth/refresh itself returns 401', async () => {
    let calls = 0
    server.use(
      http.post(`${BASE}/auth/refresh`, () => {
        calls++
        return HttpResponse.json({}, { status: 401 })
      }),
    )
    await expect(apiClient.post('/auth/refresh')).rejects.toMatchObject({
      response: { status: 401 },
    })
    expect(calls).toBe(1)
  })

  it('retries original request with new token after successful refresh on 401', async () => {
    let dataCalls = 0
    server.use(
      http.get(`${BASE}/resource`, () => {
        dataCalls++
        if (dataCalls === 1) return HttpResponse.json({}, { status: 401 })
        return HttpResponse.json({ ok: true })
      }),
    )
    vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: { accessToken: 'new-token', expiresIn: 900 },
    })

    const result = await apiClient.get('/resource')
    expect(result.data).toEqual({ ok: true })
    expect(dataCalls).toBe(2)
    expect(tokenModule.getToken()).toBe('new-token')
  })

  it('redirects to /login when refresh fails after 401', async () => {
    server.use(
      http.get(`${BASE}/secret`, () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    )
    vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('refresh failed'))

    await expect(apiClient.get('/secret')).rejects.toBeDefined()
    expect(mockLocationHref).toHaveBeenCalledWith('/login')
  })
})
