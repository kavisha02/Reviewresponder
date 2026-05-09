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
    <main className="text-slate-100">

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
