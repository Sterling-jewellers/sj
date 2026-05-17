import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RING_BUILDER_ENABLED = process.env.NEXT_PUBLIC_ENABLE_RING_BUILDER !== 'false';

export function middleware(request: NextRequest) {
  // Block all /custom-ring/* routes when ring builder is disabled
  if (!RING_BUILDER_ENABLED && request.nextUrl.pathname.startsWith('/custom-ring')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/custom-ring', '/custom-ring/:path*'],
};
