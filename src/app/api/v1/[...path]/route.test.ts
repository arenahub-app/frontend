// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET, POST, DELETE } from './route'

const originalEnv = process.env.BACKEND_URL

beforeEach(() => {
  process.env.BACKEND_URL = 'https://backend.test'
})

afterEach(() => {
  process.env.BACKEND_URL = originalEnv
  vi.restoreAllMocks()
})

function makeRequest(method: string, path: string, options: RequestInit = {}) {
  return new Request(`https://app.test/api/v1/${path}`, { method, ...options })
}

async function makeCtx(path: string[]) {
  return { params: Promise.resolve({ path }) }
}

describe('API proxy route handler', () => {
  it('returns 503 when BACKEND_URL is not set', async () => {
    delete process.env.BACKEND_URL
    const fetchSpy = vi.spyOn(global, 'fetch')
    const res = await GET(makeRequest('GET', 'groups'), await makeCtx(['groups']))
    expect(res.status).toBe(503)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('proxies GET to correct upstream URL', async () => {
    const mockResponse = new Response('[]', { status: 200 })
    vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse)

    await GET(makeRequest('GET', 'groups'), await makeCtx(['groups']))

    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://backend.test/api/v1/groups',
      }),
    )
  })

  it('proxies nested path correctly', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))

    await GET(makeRequest('GET', 'groups/123/members'), await makeCtx(['groups', '123', 'members']))

    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://backend.test/api/v1/groups/123/members' }),
    )
  })

  it('preserves query string', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('[]', { status: 200 }))
    const req = new Request('https://app.test/api/v1/groups?page=2&size=10', { method: 'GET' })

    await GET(req, await makeCtx(['groups']))

    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://backend.test/api/v1/groups?page=2&size=10' }),
    )
  })

  it('forwards Cookie header to upstream', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }))
    const req = makeRequest('POST', 'auth/refresh', {
      headers: { Cookie: 'refresh_token=abc123', 'Content-Type': 'application/json' },
      body: '{}',
    })

    await POST(req, await makeCtx(['auth', 'refresh']))

    const calledReq = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as Request
    expect(calledReq.headers.get('cookie')).toBe('refresh_token=abc123')
  })

  it('returns upstream response including Set-Cookie', async () => {
    const upstream = new Response('{"accessToken":"tok"}', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'refresh_token=xyz; Path=/api/v1/auth/refresh; HttpOnly; Secure',
      },
    })
    vi.spyOn(global, 'fetch').mockResolvedValue(upstream)

    const res = await POST(makeRequest('POST', 'auth/login', { body: '{}' }), await makeCtx(['auth', 'login']))

    expect(res.status).toBe(200)
    expect(res.headers.get('set-cookie')).toContain('refresh_token=xyz')
  })

  it('proxies DELETE with correct method', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

    const res = await DELETE(makeRequest('DELETE', 'groups/123'), await makeCtx(['groups', '123']))

    expect(res.status).toBe(204)
    const calledReq = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as Request
    expect(calledReq.method).toBe('DELETE')
  })
})
