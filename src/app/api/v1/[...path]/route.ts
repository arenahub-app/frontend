export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ path: string[] }> }

async function proxy(request: Request, path: string[]): Promise<Response> {
  const backendUrl = process.env.BACKEND_URL
  if (!backendUrl) {
    return new Response('Backend unavailable', { status: 503 })
  }

  const { search } = new URL(request.url)
  const target = new URL('/api/v1/' + path.join('/') + search, backendUrl)

  const headers = new Headers(request.headers)
  headers.delete('host')

  let body: ArrayBuffer | null = null
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.arrayBuffer()
  }

  return fetch(target.toString(), { method: request.method, headers, body })
}

export function GET(req: Request, ctx: RouteContext) {
  return ctx.params.then(({ path }) => proxy(req, path))
}

export function POST(req: Request, ctx: RouteContext) {
  return ctx.params.then(({ path }) => proxy(req, path))
}

export function PUT(req: Request, ctx: RouteContext) {
  return ctx.params.then(({ path }) => proxy(req, path))
}

export function PATCH(req: Request, ctx: RouteContext) {
  return ctx.params.then(({ path }) => proxy(req, path))
}

export function DELETE(req: Request, ctx: RouteContext) {
  return ctx.params.then(({ path }) => proxy(req, path))
}
