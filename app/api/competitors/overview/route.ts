import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    if (!businessId) return NextResponse.json({ error: "businessId is required" }, { status: 400 });

    // Parallel fetch: business, user reviews, competitors, saved recommendations
    const [
      { data: business },
      { data: userReviews },
      { data: competitors },
      { data: savedRecs },
    ] = await Promise.all([
      supabase.from("businesses").select("*").eq("id", businessId).eq("user_id", user.id).single(),
      supabase.from("reviews").select("rating, status, created_at").eq("business_id", businessId),
      supabase.from("competitor_benchmarks").select("*").eq("business_id", businessId).eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("competitor_multi_recommendations").select("recommendations, generated_at").eq("business_id", businessId).eq("user_id", user.id).single(),
    ]);

    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    // Calculate your business metrics
    const userReviewsArr = userReviews || [];
    const userAvgRating = userReviewsArr.length > 0
      ? parseFloat((userReviewsArr.reduce((s, r) => s + r.rating, 0) / userReviewsArr.length).toFixed(1))
      : 0;
    const userResponseRate = userReviewsArr.length > 0
      ? Math.round((userReviewsArr.filter((r) => r.status === "responded").length / userReviewsArr.length) * 100)
      : 0;
    const userPositive = userReviewsArr.filter((r) => r.rating >= 4).length;
    const userMixed = userReviewsArr.filter((r) => r.rating === 3).length;
    const userNegative = userReviewsArr.filter((r) => r.rating <= 2).length;

    const competitorsArr = competitors || [];

    const generatedAt = savedRecs?.generated_at ? new Date(savedRecs.generated_at).getTime() : null;
    let hasNewReviews = false;
    if (generatedAt) {
      const latestReview = userReviewsArr.reduce((max, r) => {
        const t = (r as { created_at?: string }).created_at ? new Date((r as { created_at?: string }).created_at!).getTime() : 0;
        return t > max ? t : max;
      }, 0);
      const latestSync = competitorsArr.reduce((max, c) => {
        const t = c.last_synced_at ? new Date(c.last_synced_at).getTime() : 0;
        return t > max ? t : max;
      }, 0);
      hasNewReviews = latestReview > generatedAt || latestSync > generatedAt;
    }

    // Fetch topics and snapshots for all competitors in parallel
    const [topicsResults, snapshotsResults] = await Promise.all([
      Promise.all(
        competitorsArr.map((c) =>
          supabase
            .from("competitor_topics")
            .select("topic, mention_count")
            .eq("competitor_benchmark_id", c.id)
            .order("mention_count", { ascending: false })
            .limit(5)
        )
      ),
      Promise.all(
        competitorsArr.map((c) =>
          supabase
            .from("competitor_snapshots")
            .select("snapshot_date, total_reviews, avg_rating")
            .eq("competitor_benchmark_id", c.id)
            .order("snapshot_date", { ascending: false })
            .limit(6)
        )
      ),
    ]);

    // Build ranking: [your biz + all competitors] sorted by avgRating DESC, totalReviews DESC
    const allParticipants = [
      { id: "you", avgRating: userAvgRating, totalReviews: userReviewsArr.length },
      ...competitorsArr.map((c) => ({ id: c.id, avgRating: c.avg_rating ?? 0, totalReviews: c.total_reviews ?? 0 })),
    ];
    allParticipants.sort((a, b) =>
      b.avgRating !== a.avgRating ? b.avgRating - a.avgRating : b.totalReviews - a.totalReviews
    );
    const rankMap = new Map(allParticipants.map((p, i) => [p.id, i + 1]));

    return NextResponse.json({
      yourBusiness: {
        name: business.name,
        avgRating: userAvgRating,
        totalReviews: userReviewsArr.length,
        responseRate: userResponseRate,
        positive: userPositive,
        mixed: userMixed,
        negative: userNegative,
        rank: rankMap.get("you") ?? 1,
      },
      competitors: competitorsArr.map((c, i) => ({
        id: c.id,
        name: c.competitor_name,
        location: c.competitor_location ?? null,
        avgRating: c.avg_rating ?? 0,
        totalReviews: c.total_reviews ?? 0,
        responseRate: Math.round(c.response_rate ?? 0),
        positive: c.positive_count ?? 0,
        mixed: c.mixed_count ?? 0,
        negative: c.negative_count ?? 0,
        topTopics: (topicsResults[i].data || []).map((t) => t.topic),
        lastSynced: c.last_synced_at ?? null,
        snapshots: (snapshotsResults[i].data || []).map((s) => ({
          date: s.snapshot_date,
          totalReviews: s.total_reviews ?? 0,
          avgRating: s.avg_rating ?? null,
        })),
        rank: rankMap.get(c.id) ?? i + 2,
      })),
      recommendations: Array.isArray(savedRecs?.recommendations) ? savedRecs.recommendations : [],
      hasNewReviews,
    });
  } catch (err: unknown) {
    console.error("Competitor overview error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
