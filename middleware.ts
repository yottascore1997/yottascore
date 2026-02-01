import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getAllowOrigin(req: NextRequest): string {
  const origins = process.env.ALLOWED_ORIGINS?.trim();
  if (origins) {
    const list = origins.split(',').map((o) => o.trim()).filter(Boolean);
    const origin = req.headers.get('origin');
    if (origin && list.includes(origin)) return origin;
    if (list.length > 0) return list[0];
  }
  if (process.env.NODE_ENV !== 'production') return '*';
  return '';
}

export function middleware(request: NextRequest) {
  // HTTPS redirect in production
  if (process.env.NODE_ENV === 'production') {
    const proto = request.headers.get('x-forwarded-proto') || request.headers.get('x-forwarded-protocol');
    if (proto === 'http') {
      const url = request.nextUrl.clone();
      url.protocol = 'https:';
      return NextResponse.redirect(url, 301);
    }
  }

  const allowOrigin = getAllowOrigin(request);
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Upload-Token',
    'Access-Control-Max-Age': '86400',
  };
  if (allowOrigin) corsHeaders['Access-Control-Allow-Origin'] = allowOrigin;

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const response = NextResponse.next();
  if (request.nextUrl.pathname.startsWith('/api/')) {
    for (const [k, v] of Object.entries(corsHeaders)) {
      response.headers.set(k, v);
    }
  }
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
