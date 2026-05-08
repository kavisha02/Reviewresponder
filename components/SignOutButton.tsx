/**
 * SignOutButton — client component
 *
 * Separated into its own component because it uses onClick (browser event),
 * which requires "use client". The parent DashboardPage stays a Server Component.
 *
 * Calls Supabase signOut, clears the session cookies, then redirects to home.
 */

"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-slate-800"
    >
      Sign out
    </button>
  );
}
