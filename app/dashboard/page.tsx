/**
 * Dashboard Page — /dashboard
 *
 * Multi-location aware. Fetches all businesses owned by this user,
 * then shows reviews for whichever location is selected via ?business=<id>.
 * Defaults to the first business if no param is present.
 *
 * URL:  /dashboard              → shows first business
 *       /dashboard?business=<id> → shows that specific location
 *       /dashboard?business=all  → shows all locations combined
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Business, Review } from "@/lib/types";
import ReviewCard from "@/components/ReviewCard";
import ReviewSortDropdown from "@/components/ReviewSortDropdown";
import DashboardClient from "@/components/DashboardClient";

interface PageProps {
  // searchParams is a Promise in Next.js 15+
  searchParams: Promise<{ business?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params   = await searchParams;

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch ALL businesses for this user
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true }) as { data: Business[] | null };

  // No locations yet — go to setup
  if (!businesses?.length) redirect("/dashboard/setup");

  // "all" = aggregate; otherwise pick the requested location
  const isAll      = params.business === "all";
  const selectedId = isAll
    ? "all"
    : params.business
      ? businesses.find((b) => b.id === params.business)?.id ?? businesses[0].id
      : businesses[0].id;

  const business = isAll ? null : (businesses.find((b) => b.id === selectedId) ?? businesses[0]);

  // Fetch reviews — all businesses or just the selected one
  const { data: reviews } = isAll
    ? await supabase
        .from("reviews")
        .select("*")
        .in("business_id", businesses.map((b) => b.id))
        .order("review_date", { ascending: false }) as { data: Review[] | null }
    : await supabase
        .from("reviews")
        .select("*")
        .eq("business_id", business!.id)
        .order("review_date", { ascending: false }) as { data: Review[] | null };

  const allReviews = reviews ?? [];

  // ── Stats ──────────────────────────────────────────────────────────────
  const totalReviews   = allReviews.length;
  const avgRating      = totalReviews > 0
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : "—";
  const responded      = allReviews.filter((r) => r.status === "published").length;
  const responseRate   = totalReviews > 0
    ? Math.round((responded / totalReviews) * 100)
    : 0;
  const needsAttention = allReviews.filter((r) => r.status === "new" && r.rating <= 2).length;

  return (
    <main className="text-slate-100">

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── Page header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            {isAll ? "All Locations" : business!.name}
          </h1>
          <p className="text-slate-400 text-sm">
            {isAll
              ? `${businesses.length} location${businesses.length !== 1 ? "s" : ""} · Reviews Dashboard`
              : `${business!.business_type ?? "Business"} · Reviews Dashboard`
            }
          </p>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Reviews",   value: totalReviews,       suffix: "",  color: "text-white" },
            { label: "Average Rating",  value: avgRating,          suffix: "★", color: "text-yellow-400" },
            { label: "Response Rate",   value: `${responseRate}`,  suffix: "%", color: "text-emerald-400" },
            { label: "Needs Attention", value: needsAttention,     suffix: "",  color: needsAttention > 0 ? "text-red-400" : "text-slate-400" },
          ].map((stat) => (
            <div key={stat.label} className="stat-card bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}{stat.suffix}
              </div>
              <div className="text-slate-400 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Urgent alert banner ── */}
        {needsAttention > 0 && (
          <div className="bg-red-950/50 border border-red-700/50 rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="text-red-300 font-medium text-sm">
                {needsAttention} negative review{needsAttention > 1 ? "s" : ""} need{needsAttention === 1 ? "s" : ""} urgent attention
              </div>
              <div className="text-red-400/70 text-xs mt-0.5">
                Unanswered negative reviews hurt your Google ranking.
              </div>
            </div>
          </div>
        )}

        {/* ── Reviews section with sorting ── */}
        <DashboardClient
          allReviews={allReviews}
          isAllLocations={isAll}
          businessId={isAll ? "" : selectedId}
        />
      </div>
    </main>
  );
}
