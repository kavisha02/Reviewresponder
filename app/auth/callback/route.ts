/**
 * OAuth Callback Route — /auth/callback
 *
 * After a user clicks the confirmation link in their signup email,
 * Supabase redirects them here with a short-lived `code` in the URL.
 *
 * This route exchanges that code for a real session (access + refresh tokens),
 * stores the session in cookies, then sends the user to the home hub (/home).
 *
 * This same route also handles Google OAuth in Phase 3.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Where to redirect after successful login (defaults to /home)
  const next = searchParams.get("next") ?? "/home";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Session created — send user to the dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send to login with an error flag
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
