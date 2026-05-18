import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RING_BUILDER_ENABLED = process.env.NEXT_PUBLIC_ENABLE_RING_BUILDER !== 'false';
const DIAMONDS_ENABLED     = process.env.NEXT_PUBLIC_SHOW_DIAMONDS !== 'false';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block all /custom-ring/* routes when ring builder is disabled
  if (!RING_BUILDER_ENABLED && pathname.startsWith('/custom-ring')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Block /diamonds and /diamonds/* when diamonds section is disabled
  if (!DIAMONDS_ENABLED && (pathname === '/diamonds' || pathname.startsWith('/diamonds/'))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/custom-ring', '/custom-ring/:path*', '/diamonds', '/diamonds/:path*'],
};
