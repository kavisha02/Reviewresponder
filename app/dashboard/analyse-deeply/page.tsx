/**
 * Deep Analysis Page — /dashboard/analyse-deeply?business=<id>
 *
 * Comprehensive analysis dashboard with:
 * - Location overview (summary, services, customer sentiment)
 * - Category-based analysis (topics with sentiment)
 * - Sentiment breakdown (positive, negative, mixed)
 * - Featured top 3 positive reviews
 * - Professional visualizations and charts
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Business, Review } from "@/lib/types";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import LocationSwitcher from "@/components/LocationSwitcher";
import DeepAnalysisClient from "@/components/DeepAnalysisClient";

interface PageProps {
  searchParams: Promise<{ business?: string }>;
}

export default async function DeepAnalysisPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch all businesses
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true }) as { data: Business[] | null };

  if (!businesses?.length) redirect("/dashboard/setup");

  // Get selected business
  const selectedId = params.business
    ? businesses.find((b) => b.id === params.business)?.id ?? businesses[0].id
    : businesses[0].id;

  const business = businesses.find((b) => b.id === selectedId) ?? businesses[0];

  // Fetch reviews for this business
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("business_id", selectedId)
    .order("review_date", { ascending: false }) as { data: Review[] | null };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* ── Navbar ── */}
      <nav className="navbar-blur sticky top-0 z-50 w-full border-b border-slate-700/50">
        <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 hover:opacity-80 transition-opacity"
            >
              RR
            </Link>
            <LocationSwitcher
              businesses={businesses}
              currentId={selectedId}
              basePath="/dashboard/analyse-deeply"
              showAll={false}
            />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/analytics"
              className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all duration-200 hidden sm:block"
            >
              Analytics
            </Link>
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

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Deep Analysis</h1>
          <p className="text-slate-400">
            Comprehensive insights for <span className="text-indigo-400 font-semibold">{business.name}</span>
          </p>
        </div>

        {/* Client Component with all analysis */}
        <DeepAnalysisClient businessId={selectedId} reviews={reviews || []} business={business} />
      </div>
    </main>
  );
}
