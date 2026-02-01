/**
 * CORS: use ALLOWED_ORIGINS in production (comma-separated).
 * In development, * is allowed if ALLOWED_ORIGINS is not set.
 */

function getAllowedOrigin(req: Request): string {
  const origins = process.env.ALLOWED_ORIGINS?.trim()
  if (origins) {
    const list = origins.split(',').map((o) => o.trim()).filter(Boolean)
    const origin = req.headers.get('origin')
    if (origin && list.includes(origin)) return origin
    if (list.length > 0) return list[0]
  }
  if (process.env.NODE_ENV !== 'production') {
    return '*'
  }
  return ''
}

export function withCORS(handler: (req: Request, ...args: unknown[]) => Promise<Response> | Response) {
  return async (req: Request, ...args: unknown[]) => {
    const allowOrigin = getAllowedOrigin(req)
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Upload-Token',
    }
    if (allowOrigin) headers['Access-Control-Allow-Origin'] = allowOrigin

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }
    const response = await handler(req, ...args)
    for (const [k, v] of Object.entries(headers)) {
      response.headers.set(k, v)
    }
    return response
  }
}
