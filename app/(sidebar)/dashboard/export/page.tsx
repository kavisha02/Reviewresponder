import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Business, Review } from "@/lib/types";
import ExportReportClient from "@/components/ExportReportClient";
import { getCachedAnalysis } from "@/lib/supabase/analytics-cache";

interface PageProps {
  searchParams: Promise<{ business?: string }>;
}

function detectLang(text: string | null): "english" | "hindi" | "hinglish" {
  if (!text) return "english";
  const hasDevanagari = /[ऀ-ॿ]/.test(text);
  const hasLatin      = /[a-zA-Z]{3,}/.test(text);
  if (hasDevanagari && hasLatin) return "hinglish";
  if (hasDevanagari)             return "hindi";
  return "english";
}

export default async function ExportPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params   = await searchParams;

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

  // Fetch reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("business_id", business.id)
    .order("review_date", { ascending: false }) as { data: Review[] | null };

  const all = reviews ?? [];
  const total = all.length;

  // Compute metrics
  const avgRatingNum = total > 0
    ? all.reduce((s, r) => s + r.rating, 0) / total
    : 0;
  const avgRating = avgRatingNum.toFixed(1);

  const responded     = all.filter((r) => r.status === "responded").length;
  const responseRate  = total > 0 ? Math.round((responded / total) * 100) : 0;

  const thirtyAgo     = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const last30        = all.filter((r) => r.review_date && new Date(r.review_date) > thirtyAgo);
  const needsAttention = all.filter((r) => r.status === "new" && r.rating <= 2).length;

  // Rating distribution
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: all.filter((r) => r.rating === star).length,
  }));

  // Status breakdown
  const statusData = [
    { label: "Draft Ready", count: all.filter((r) => r.status === "draft").length },
    { label: "Needs Response", count: all.filter((r) => r.status === "new").length },
    { label: "Responded", count: all.filter((r) => r.status === "responded").length },
    { label: "Ignored", count: all.filter((r) => r.status === "ignored").length },
  ];

  // Monthly volume — last 6 months
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
      label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      count: monthRevs.length,
      avgRating: avgR,
    };
  });

  // Sentiment
  const sentPositive = all.filter((r) => r.rating >= 4).length;
  const sentNeutral  = all.filter((r) => r.rating === 3).length;
  const sentNegative = all.filter((r) => r.rating <= 2).length;

  // Language breakdown
  const langCounts = {
    english:  all.filter((r) => detectLang(r.review_text) === "english").length,
    hindi:    all.filter((r) => detectLang(r.review_text) === "hindi").length,
    hinglish: all.filter((r) => detectLang(r.review_text) === "hinglish").length,
  };

  // Negative review response rate
  const negReviews    = all.filter((r) => r.rating <= 2);
  const negResponded  = negReviews.filter((r) => r.status === "draft").length;
  const negRespRate   = negReviews.length > 0
    ? Math.round((negResponded / negReviews.length) * 100)
    : 0;

  // Top 10 reviews by rating
  const topReviews = [...all]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10);

  // Published responses
  const publishedReviews = all.filter((r) => r.status === "responded");

  // Fetch cached analyses
  const [categoryCache, sentimentCache, insightsCache, summaryCache] = await Promise.all([
    getCachedAnalysis(business.id, "category"),
    getCachedAnalysis(business.id, "sentiment"),
    getCachedAnalysis(business.id, "insights"),
    getCachedAnalysis(business.id, "summary"),
  ]);

  const reportData = {
    business,
    reviews: all,
    metrics: {
      total,
      avgRating,
      avgRatingNum,
      responseRate,
      last30Count: last30.length,
      needsAttention,
      ratingCounts,
      statusData,
      monthlyData,
      sentPositive,
      sentNeutral,
      sentNegative,
      langCounts,
      negRespRate,
      topReviews,
      publishedReviews,
    },
    analyses: {
      category: categoryCache?.results,
      sentiment: sentimentCache?.results,
      insights: insightsCache?.results,
      summary: summaryCache?.results,
    },
  };

  return (
    <main className="text-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Export Report</h1>
          <p className="text-slate-400 text-sm">
            Download your review analytics and AI insights as PDF or Word document
          </p>
        </div>

        <ExportReportClient reportData={reportData} />
      </div>
    </main>
  );
}
