/**
 * Next.js Middleware — runs on every request before the page renders.
 *
 * Two jobs:
 *  1. Refresh the Supabase session cookie so it never expires silently.
 *     Without this, server components would see a stale/null session
 *     even when the user is still logged in.
 *
 *  2. Protect routes under /dashboard — redirect unauthenticated users
 *     to /auth/login instead of showing them the dashboard.
 *
 * The `matcher` at the bottom tells Next.js which paths to run this on.
 * Static files and Next.js internals are excluded for performance.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Build a Supabase client that can read/write cookies on this request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write updated cookies onto both the request and the response
          // so the session stays fresh for the current and future requests
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — IMPORTANT: do not remove this call.
  // It silently renews the access token if it has expired.
  const { data: { user } } = await supabase.auth.getUser();

  // ── Route protection ──────────────────────────────────────────────────────
  // Any path starting with /dashboard requires a logged-in user.
  // Unauthenticated visitors are sent to the login page.
  const isProtected = request.nextUrl.pathname.startsWith("/dashboard");

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    // Pass the original URL so we can redirect back after login (Phase 3+)
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from login/signup to the dashboard
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth/login") ||
                     request.nextUrl.pathname.startsWith("/auth/signup");

  if (isAuthPage && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on all paths EXCEPT Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
