/**
 * Supabase Browser Client
 *
 * Use this in Client Components ("use client") and browser-side code.
 * Creates one shared instance per page load (singleton pattern via module cache).
 *
 * DO NOT use this in Server Components, API routes, or middleware —
 * use lib/supabase/server.ts for those instead.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
