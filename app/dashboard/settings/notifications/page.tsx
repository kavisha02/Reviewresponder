/**
 * Notification Settings Page — /dashboard/settings/notifications
 *
 * Allows users to configure:
 * - Negative review alerts (on/off)
 * - Daily digest (on/off, time preference)
 * - Email address for notifications
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import NotificationSettingsClient from "@/components/NotificationSettingsClient";

interface PageProps {
  searchParams: Promise<{ business?: string }>;
}

export default async function NotificationSettingsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch businesses
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!businesses?.length) redirect("/dashboard/setup");

  const selectedId = params.business
    ? businesses.find((b) => b.id === params.business)?.id ?? businesses[0].id
    : businesses[0].id;

  const business = businesses.find((b) => b.id === selectedId) ?? businesses[0];

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navbar */}
      <nav className="navbar-blur sticky top-0 z-50 w-full">
        <div className="flex items-center justify-between px-6 py-3 max-w-6xl mx-auto gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 hover:opacity-80 transition-opacity"
            >
              RR
            </Link>
            <h1 className="text-lg font-semibold">Notification Settings</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all duration-200 hidden sm:block"
            >
              Home
            </Link>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Email Notifications
          </h2>
          <p className="text-slate-400">
            Manage how you receive alerts and digests for {business.name}
          </p>
        </div>

        <NotificationSettingsClient
          businessId={selectedId}
          userEmail={user.email || ""}
        />
      </div>
    </main>
  );
}
