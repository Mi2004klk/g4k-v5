import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('g4k_token');
  const path = request.nextUrl.pathname;

  if (path.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Parse capabilities
    const capabilitiesCookie = request.cookies.get('g4k_capabilities')?.value;
    let capabilities: string[] = [];
    if (capabilitiesCookie) {
      try {
        capabilities = JSON.parse(decodeURIComponent(capabilitiesCookie));
      } catch (e) {
        // ignore
      }
    }

    // Role-based capability checks
    const hasCapability = (cap: string) => capabilities.includes('*') || capabilities.includes(cap);

    const routes = [
      { pattern: /^\/dashboard\/org\/users/, cap: 'users.hr.manage' },
      { pattern: /^\/dashboard\/org\/departments/, cap: 'admin.manage-company' },
      { pattern: /^\/dashboard\/org\/designations/, cap: 'admin.manage-company' },
      { pattern: /^\/dashboard\/org\/attendance/, cap: 'hr.view-team-attendance' },
      { pattern: /^\/dashboard\/org\/leave/, cap: 'hr.view-team-leave' },
      { pattern: /^\/dashboard\/audit/, cap: 'admin.manage-roles' },
    ];

    for (const route of routes) {
      if (route.pattern.test(path) && !hasCapability(route.cap)) {
        const url = new URL('/dashboard', request.url);
        url.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
