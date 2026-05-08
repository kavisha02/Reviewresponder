/**
 * Supabase Server Client
 *
 * Use this in Server Components, API Route handlers, and Middleware.
 * Do NOT use this in browser/client components — use lib/supabase/client.ts there.
 *
 * It reads and writes cookies so Supabase can track the user session
 * across server-rendered requests. Each call creates a fresh client
 * scoped to the current request's cookies.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component — cookies can only
            // be set from middleware or route handlers, so we ignore errors here.
            // The middleware below keeps the session refreshed regardless.
          }
        },
      },
    }
  );
}
