/**
 * Analytics Page — /dashboard/analytics?business=<id>
 *
 * Server component. Computes all metrics from raw review data and
 * renders a full analytics report using CSS-based charts (no npm charts lib).
 *
 * Sections:
 *   1. Key metrics row (5 cards)
 *   2. Rating distribution (horizontal bars, 1–5 ★)
 *   3. Review status breakdown
 *   4. Monthly review volume — last 6 months (vertical bars)
 *   5. Sentiment analysis (positive / neutral / negative)
 *   6. Language breakdown (English / Hindi / Hinglish)
 *   7. Insights callouts
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Business, Review } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{ business?: string }>;
}

// ── helpers ─────────────────────────────────────────────────────────────────

function detectLang(text: string | null): "english" | "hindi" | "hinglish" {
  if (!text) return "english";
  const hasDevanagari = /[ऀ-ॿ]/.test(text);
  const hasLatin      = /[a-zA-Z]{3,}/.test(text);
  if (hasDevanagari && hasLatin) return "hinglish";
  if (hasDevanagari)             return "hindi";
  return "english";
}

// ── horizontal bar row ───────────────────────────────────────────────────────

function HBar({
  label, count, total, colorClass, dimLabel,
}: {
  label: string; count: number; total: number;
  colorClass: string; dimLabel?: boolean;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className={`w-28 text-right text-sm ${dimLabel ? "text-slate-500" : "text-slate-300"} shrink-0`}>
        {label}
      </div>
      <div className="flex-1 bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-8 text-sm font-semibold text-white text-right shrink-0">{count}</div>
      <div className="w-10 text-xs text-slate-500 shrink-0">{pct}%</div>
    </div>
  );
}

// ── main page ────────────────────────────────────────────────────────────────

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params   = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch all businesses (for header display + ownership check)
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true }) as { data: Business[] | null };

  if (!businesses?.length) redirect("/dashboard/setup");

  // "all" = aggregate across every location; otherwise pick the requested one
  const isAll      = params.business === "all";
  const selectedId = isAll
    ? "all"
    : params.business
      ? businesses.find((b) => b.id === params.business)?.id ?? businesses[0].id
      : businesses[0].id;

  const business = isAll ? null : (businesses.find((b) => b.id === selectedId) ?? businesses[0]);

  // Fetch reviews — all businesses combined or just the selected one
  const { data: reviews } = isAll
    ? await supabase
        .from("reviews")
        .select("*")
        .in("business_id", businesses.map((b) => b.id))
        .order("review_date", { ascending: true }) as { data: Review[] | null }
    : await supabase
        .from("reviews")
        .select("*")
        .eq("business_id", business!.id)
        .order("review_date", { ascending: true }) as { data: Review[] | null };

  const all   = reviews ?? [];
  const total = all.length;
  
  const totalPlatformReviews = isAll 
    ? businesses.reduce((sum, b) => sum + (b.total_platform_reviews || 0), 0) || total
    : business?.total_platform_reviews || total;

  // ── 1. Key metrics ──────────────────────────────────────────────────────
  const avgRating = total > 0
    ? (all.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
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

  const responded     = all.filter((r) => r.status === "responded").length;
  const responseRate  = total > 0 ? Math.round((responded / total) * 100) : 0;

  const thirtyAgo     = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const last30        = all.filter((r) => r.review_date && new Date(r.review_date) > thirtyAgo);
  const needsAttention = all.filter((r) => r.status === "new" && r.rating <= 2).length;

  // ── 2. Rating distribution ──────────────────────────────────────────────
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: all.filter((r) => r.rating === star).length,
  }));
  const ratingColors: Record<number, string> = {
    5: "bg-emerald-500",
    4: "bg-green-400",
    3: "bg-yellow-400",
    2: "bg-orange-400",
    1: "bg-red-500",
  };

  // ── 3. Status breakdown ─────────────────────────────────────────────────
  const statusData = [
    { label: "Draft Ready",      key: "draft", count: all.filter((r) => r.status === "draft").length, color: "bg-blue-500" },
    { label: "Needs Response", key: "new",        count: all.filter((r) => r.status === "new").length,       color: "bg-yellow-400" },
    { label: "Ignored",        key: "ignored",    count: all.filter((r) => r.status === "ignored").length,   color: "bg-slate-500"  },
  ];

  // ── 4. Monthly volume — last 6 months ───────────────────────────────────
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const monthRevs = all.filter((r) => {
      const rd = new Date(r.review_date ?? "");
      return rd.getFullYear() === y && rd.getMonth() === m;
    });
    const avgR = monthRevs.length > 0
      ? monthRevs.reduce((s, r) => s + r.rating, 0) / monthRevs.length
      : 0;
    return {
      label:     d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      count:     monthRevs.length,
      avgRating: avgR,
    };
  });
  const maxMonthCount = Math.max(...monthlyData.map((m) => m.count), 1);

  // ── 5. Sentiment ────────────────────────────────────────────────────────
  const sentPositive = all.filter((r) => r.rating >= 4).length;
  const sentNeutral  = all.filter((r) => r.rating === 3).length;
  const sentNegative = all.filter((r) => r.rating <= 2).length;

  // ── 6. Language breakdown ───────────────────────────────────────────────
  const langCounts = {
    english:  all.filter((r) => detectLang(r.review_text) === "english").length,
    hindi:    all.filter((r) => detectLang(r.review_text) === "hindi").length,
    hinglish: all.filter((r) => detectLang(r.review_text) === "hinglish").length,
  };

  // ── 7. Extra insights ───────────────────────────────────────────────────
  const negReviews    = all.filter((r) => r.rating <= 2);
  const negResponded  = negReviews.filter((r) => r.status === "draft").length;
  const negRespRate   = negReviews.length > 0
    ? Math.round((negResponded / negReviews.length) * 100)
    : 0;

  // Best month (most reviews)
  const bestMonth     = [...monthlyData].sort((a, b) => b.count - a.count)[0];
  // Month with best avg rating (only months that have reviews)
  const bestRatingMonth = monthlyData
    .filter((m) => m.count > 0)
    .sort((a, b) => b.avgRating - a.avgRating)[0];

  const ratingOnly = all.filter((r) => !r.review_text).length;

  // ── render ───────────────────────────────────────────────────────────────
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
              ? `${businesses.length} location${businesses.length !== 1 ? "s" : ""} · Combined Analytics Report`
              : `${business!.business_type ?? "Business"} · Full Analytics Report`
            }
          </p>
        </div>

        {/* ── Empty state ── */}
        {total === 0 && (
          <div className="text-center py-24 text-slate-500">
            <div className="text-5xl mb-4">📊</div>
            <p>No reviews to analyse yet.</p>
            <p className="text-xs mt-1 text-slate-600">Reviews will appear here once synced.</p>
          </div>
        )}

        {total > 0 && (
          <div className="space-y-6">

            {/* ── 1. Key metrics ── */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[
                { label: "Total Reviews",    value: totalPlatformReviews, suffix: "",  color: "text-white" },
                { label: "Fetched & Analyzed", value: total,             suffix: "",  color: "text-indigo-400" },
                { label: "Total Rating",   value: totalPlatformRating,           suffix: "★", color: "text-yellow-400" },
                { label: "Fetched Rating",   value: avgRating,           suffix: "★", color: "text-yellow-400" },
                { label: "Response Rate",    value: `${responseRate}`,   suffix: "%", color: "text-emerald-400" },
                { label: "Needs Attention",  value: needsAttention,      suffix: "",  color: needsAttention > 0 ? "text-red-400" : "text-slate-400" },
              ].map((s) => (
                <div key={s.label} className="stat-card bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}{s.suffix}</div>
                  <div className="text-slate-400 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── 2 + 3. Rating distribution + Status — side by side ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Rating distribution */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
                  Rating Distribution
                </h2>
                <div className="space-y-3">
                  {ratingCounts.map(({ star, count }) => (
                    <HBar
                      key={star}
                      label={`${"★".repeat(star)}${"☆".repeat(5 - star)}`}
                      count={count}
                      total={total}
                      colorClass={ratingColors[star]}
                    />
                  ))}
                </div>
              </div>

              {/* Review status */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
                  Review Status
                </h2>
                <div className="space-y-3">
                  {statusData.map((s) => (
                    <HBar
                      key={s.key}
                      label={s.label}
                      count={s.count}
                      total={total}
                      colorClass={s.color}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ── 4. Monthly volume ── */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                Monthly Review Volume
              </h2>
              <p className="text-slate-500 text-xs mb-6">Last 6 months</p>

              <div className="flex items-end gap-3 h-40">
                {monthlyData.map((m) => {
                  const heightPct = (m.count / maxMonthCount) * 100;
                  const isGood    = m.avgRating >= 4;
                  const barColor  = m.count === 0
                    ? "bg-slate-700/40"
                    : isGood
                      ? "bg-indigo-600 hover:bg-indigo-500"
                      : "bg-violet-600 hover:bg-violet-500";
                  return (
                    <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
                      {/* Count label */}
                      <div className="text-xs font-semibold text-white h-4">
                        {m.count > 0 ? m.count : ""}
                      </div>
                      {/* Bar */}
                      <div className="w-full flex items-end" style={{ height: "96px" }}>
                        <div
                          className={`w-full rounded-t transition-all duration-700 ${barColor}`}
                          style={{
                            height: m.count === 0 ? "4px" : `${heightPct}%`,
                            opacity: m.count === 0 ? 0.3 : 1,
                          }}
                          title={`${m.label}: ${m.count} review${m.count !== 1 ? "s" : ""}, avg ${m.avgRating > 0 ? m.avgRating.toFixed(1) : "—"}★`}
                        />
                      </div>
                      {/* Month label */}
                      <div className="text-xs text-slate-400 text-center leading-tight">{m.label}</div>
                      {/* Avg rating */}
                      <div className="text-xs text-slate-600 text-center">
                        {m.count > 0 ? `${m.avgRating.toFixed(1)}★` : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 5 + 6. Response Quality + Language — side by side ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Response Quality & Trends */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
                  Response Quality & Trends
                </h2>
                <div className="space-y-4">
                  {/* Response time indicator */}
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Response Coverage</div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <div className="bg-slate-700/50 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                            style={{ width: `${responseRate}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-indigo-400">{responseRate}%</div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{responded} of {total} reviews have responses</p>
                  </div>

                  {/* Negative review handling */}
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Negative Review Handling</div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <div className="bg-slate-700/50 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              negRespRate >= 75 ? "bg-emerald-500" : negRespRate >= 50 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${negRespRate}%` }}
                          />
                        </div>
                      </div>
                      <div className={`text-sm font-semibold ${
                        negRespRate >= 75 ? "text-emerald-400" : negRespRate >= 50 ? "text-yellow-400" : "text-red-400"
                      }`}>{negRespRate}%</div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{negResponded} of {negReviews.length} negative reviews addressed</p>
                  </div>

                  {/* Rating trend */}
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Average Rating</div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-yellow-400">{avgRating}★</div>
                      <div className="text-xs text-slate-500">
                        {typeof avgRating === "string" ? "—" : avgRating >= 4 ? "Excellent" : avgRating >= 3 ? "Good" : "Needs Improvement"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Language breakdown */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                  Language Breakdown
                </h2>
                <p className="text-slate-500 text-xs mb-4">Detected from review text</p>
                <div className="space-y-3">
                  <HBar label="English"  count={langCounts.english}  total={total} colorClass="bg-sky-500" />
                  <HBar label="Hindi"    count={langCounts.hindi}    total={total} colorClass="bg-orange-400" />
                  <HBar label="Hinglish" count={langCounts.hinglish} total={total} colorClass="bg-violet-500" />
                </div>
                <div className="mt-5 pt-4 border-t border-slate-700 text-xs text-slate-500 space-y-1">
                  <p>Hindi: Devanagari script detected</p>
                  <p>Hinglish: mix of Devanagari + Latin</p>
                  {ratingOnly > 0 && (
                    <p>{ratingOnly} review{ratingOnly > 1 ? "s" : ""} had no text (rating only)</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── 7. Insights callouts ── */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
                Key Insights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    icon: "📈",
                    label: "Busiest Month",
                    value: bestMonth.count > 0 ? `${bestMonth.label} (${bestMonth.count} reviews)` : "No data yet",
                    color: "border-indigo-800/50 bg-indigo-950/20",
                  },
                  {
                    icon: "⭐",
                    label: "Best Rated Month",
                    value: bestRatingMonth ? `${bestRatingMonth.label} (${bestRatingMonth.avgRating.toFixed(1)}★ avg)` : "No data yet",
                    color: "border-yellow-800/50 bg-yellow-950/20",
                  },
                  {
                    icon: "💬",
                    label: "Overall Response Rate",
                    value: `${responseRate}% of all reviews answered`,
                    color: "border-emerald-800/50 bg-emerald-950/20",
                  },
                  {
                    icon: "🚨",
                    label: "Negative Review Response",
                    value: negReviews.length > 0
                      ? `${negRespRate}% of ${negReviews.length} negative reviews addressed`
                      : "No negative reviews",
                    color: negRespRate < 50 && negReviews.length > 0
                      ? "border-red-800/50 bg-red-950/20"
                      : "border-emerald-800/50 bg-emerald-950/20",
                  },
                  {
                    icon: "📊",
                    label: "30-Day Activity",
                    value: last30.length > 0
                      ? `${last30.length} new review${last30.length > 1 ? "s" : ""} in the last month`
                      : "No reviews in the last 30 days",
                    color: "border-slate-700 bg-slate-800/40",
                  },
                  {
                    icon: "🌐",
                    label: "Primary Language",
                    value: langCounts.hindi + langCounts.hinglish > langCounts.english
                      ? `Hindi/Hinglish dominant (${langCounts.hindi + langCounts.hinglish} reviews)`
                      : `English dominant (${langCounts.english} reviews)`,
                    color: "border-sky-800/50 bg-sky-950/20",
                  },
                ].map((insight) => (
                  <div
                    key={insight.label}
                    className={`rounded-lg border p-4 ${insight.color}`}
                  >
                    <div className="text-xl mb-1.5">{insight.icon}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{insight.label}</div>
                    <div className="text-sm text-slate-200 font-medium leading-snug">{insight.value}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

    </main>
  );
}
