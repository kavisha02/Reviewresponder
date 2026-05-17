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

  // ── Stats ─────────────────────────────────────────────────────────────
  const fetchedReviews = allReviews.length;
  const totalPlatformReviews = isAll 
    ? businesses.reduce((sum, b) => sum + (b.total_platform_reviews || 0), 0) || fetchedReviews
    : business?.total_platform_reviews || fetchedReviews;

  const avgRating      = fetchedReviews > 0
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / fetchedReviews).toFixed(1)
    : "—";

  let totalPlatformRating: string | number = "—";
  if (isAll) {
    let sumScore = 0;
    let sumWeight = 0;
    for (const b of businesses) {
      if (b.total_platform_rating && b.total_platform_reviews) {
        sumScore += Number(b.total_platform_rating) * Number(b.total_platform_reviews);
        sumWeight += Number(b.total_platform_reviews);
      } else if (b.total_platform_rating) {
        sumScore += Number(b.total_platform_rating);
        sumWeight += 1;
      }
    }
    if (sumWeight > 0) {
      totalPlatformRating = (sumScore / sumWeight).toFixed(1);
    } else {
      totalPlatformRating = avgRating; // fallback
    }
  } else {
    totalPlatformRating = business?.total_platform_rating 
      ? Number(business.total_platform_rating).toFixed(1) 
      : avgRating;
  }
  const responded      = allReviews.filter((r) => r.status === "responded").length;
  const responseRate   = fetchedReviews > 0
    ? Math.round((responded / fetchedReviews) * 100)
    : 0;
  const needsAttention = allReviews.filter((r) => r.status === "new" && r.rating <= 2).length;
  const highImpactCount = allReviews.filter((r) => r.is_local_guide || (r.reviewer_review_count && r.reviewer_review_count > 50) || (r.likes_count && r.likes_count > 5)).length;

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
          {[
            { label: "High Impact Reviews", value: highImpactCount, suffix: "", color: "text-amber-400", tooltip: "Reviews from Local Guides, users with 50+ reviews, or reviews with 5+ likes. Highly influential." },
            { label: "Total Reviews",   value: totalPlatformReviews, suffix: "",  color: "text-white" },
            { label: "Fetched & Analyzed", value: fetchedReviews, suffix: "", color: "text-indigo-400" },
            { label: "Total Rating",  value: totalPlatformRating,          suffix: "★", color: "text-yellow-400" },
            { label: "Fetched Rating",  value: avgRating,          suffix: "★", color: "text-yellow-400" },
            { label: "Response Rate",   value: `${responseRate}`,  suffix: "%", color: "text-emerald-400" },
            { label: "Needs Attention", value: needsAttention,     suffix: "",  color: needsAttention > 0 ? "text-red-400" : "text-slate-400" },
          ].map((stat) => (
            <div key={stat.label} className="stat-card bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}{stat.suffix}
              </div>
              <div className="text-slate-400 text-xs mt-1 uppercase tracking-wider font-semibold flex items-center gap-1">
                {stat.label}
                {stat.tooltip && (
                  <span className="text-slate-500 cursor-pointer normal-case" title={stat.tooltip}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 hover:text-slate-300 transition-colors">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                  </span>
                )}
              </div>
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
          business={business}
        />
      </div>
    </main>
  );
}
