import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED: Record<string, string> = {
  "/dashboard/org/users": "users.employee.manage",
  "/dashboard/org/attendance": "hr.view-team-attendance",
  "/dashboard/org/leave": "leave.approve-employee",
  "/dashboard/org/departments": "departments.manage",
  "/dashboard/org/designations": "designations.manage",
  "/dashboard/settings": "settings.manage",
  "/dashboard/audit": "audit.view",
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Only intercept /dashboard paths
  if (!pathname.startsWith("/dashboard")) return NextResponse.next();
  
  // Verify auth cookie
  const token = req.cookies.get("g4k_token")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  
  // Check if route is protected
  const required = Object.entries(PROTECTED).find(([r]) => pathname.startsWith(r))?.[1];
  
  if (required) {
    const raw = req.cookies.get("g4k_capabilities")?.value;
    let caps: string[] = [];
    try { 
      caps = raw ? JSON.parse(decodeURIComponent(raw)) : []; 
    } catch {}
    
    const ok = caps.includes("*") || caps.includes(required);
    
    if (!ok) {
      // Redirect back to main dashboard with an error flag
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
    }
  }
  
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
