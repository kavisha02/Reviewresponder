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

    // Parallel fetch: business, user reviews, competitors, saved recommendations, own topic cache
    const [
      { data: business },
      { data: userReviews },
      { data: competitors },
      { data: savedRecs },
      { data: topicCache },
    ] = await Promise.all([
      supabase.from("businesses").select("*").eq("id", businessId).eq("user_id", user.id).single(),
      supabase.from("reviews").select("rating, status, created_at, is_local_guide, reviewer_review_count, likes_count").eq("business_id", businessId),
      supabase.from("competitor_benchmarks").select("*").eq("business_id", businessId).eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("competitor_multi_recommendations").select("recommendations, generated_at").eq("business_id", businessId).eq("user_id", user.id).single(),
      supabase.from("analytics_cache").select("results").eq("business_id", businessId).eq("analysis_type", "category").single(),
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
    const userHighImpact = userReviewsArr.filter((r) => r.is_local_guide || (r.reviewer_review_count && r.reviewer_review_count > 50) || (r.likes_count && r.likes_count > 5)).length;

    const userTopTopics: string[] = (() => {
      if (!topicCache?.results) return [];
      const results = topicCache.results as { topics?: Array<{ topic: string; mentions: number }> };
      if (!Array.isArray(results.topics)) return [];
      return results.topics
        .sort((a, b) => (b.mentions || 0) - (a.mentions || 0))
        .slice(0, 3)
        .map((t) => t.topic);
    })();

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

    // Calculate Bayesian Average for fair ranking: (R*v + C*m) / (v + m)
    const allParticipants = [
      { id: "you", avgRating: Number(business.total_platform_rating || userAvgRating), totalReviews: Number(business.total_platform_reviews || userReviewsArr.length) },
      ...competitorsArr.map((c) => ({ id: c.id, avgRating: Number(c.total_platform_rating || c.avg_rating || 0), totalReviews: Number(c.total_platform_reviews || c.total_reviews || 0) })),
    ];
    
    const m = allParticipants.reduce((sum, p) => sum + p.totalReviews, 0) / (allParticipants.length || 1);
    const C = allParticipants.reduce((sum, p) => sum + p.avgRating, 0) / (allParticipants.length || 1);

    const participantsWithScore = allParticipants.map(p => ({
      ...p,
      fairScore: (p.avgRating * p.totalReviews + C * m) / (p.totalReviews + m) || 0
    }));

    participantsWithScore.sort((a, b) => b.fairScore - a.fairScore);
    const rankMap = new Map(participantsWithScore.map((p, i) => [p.id, i + 1]));

    return NextResponse.json({
      yourBusiness: {
        name: business.name,
        avgRating: business.total_platform_rating || userAvgRating,
        fetchedAvgRating: userAvgRating,
        totalReviews: userReviewsArr.length,
        totalPlatformReviews: business.total_platform_reviews || userReviewsArr.length,
        totalPlatformRating: business.total_platform_rating || userAvgRating,
        responseRate: userResponseRate,
        positive: userPositive,
        mixed: userMixed,
        negative: userNegative,
        negative: userNegative,
        highImpactCount: userHighImpact,
        topTopics: userTopTopics,
        rank: rankMap.get("you") ?? 1,
        fairScore: participantsWithScore.find(p => p.id === "you")?.fairScore ?? userAvgRating,
      },
      competitors: competitorsArr.map((c, i) => ({
        id: c.id,
        name: c.competitor_name,
        location: c.competitor_location ?? null,
        avgRating: c.total_platform_rating || c.avg_rating || 0,
        fetchedAvgRating: c.avg_rating || 0,
        totalReviews: c.total_reviews ?? 0,
        totalPlatformReviews: c.total_platform_reviews || c.total_reviews || 0,
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
        highImpactCount: c.high_impact_count ?? 0,
        rank: rankMap.get(c.id) ?? i + 2,
        fairScore: participantsWithScore.find(p => p.id === c.id)?.fairScore ?? (c.total_platform_rating || c.avg_rating || 0),
      })),
      recommendations: Array.isArray(savedRecs?.recommendations) ? savedRecs.recommendations : [],
      hasNewReviews,
    });
  } catch (err: unknown) {
    console.error("Competitor overview error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
