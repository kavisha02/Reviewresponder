/**
 * API Route: GET /api/competitors/:competitorId/head-to-head
 *
 * Fetches head-to-head comparison data between user's business and a competitor.
 *
 * Query params: businessId (required)
 * Response: { yourBusiness: {...}, competitor: {...}, insights: string[] }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateHeadToHeadInsights } from "@/lib/competitors/gemini-analysis";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ competitorId: string }> }
) {
  try {
    const { competitorId } = await params;
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId query parameter is required" },
        { status: 400 }
      );
    }

    // Verify competitor belongs to user
    const { data: competitor } = await supabase
      .from("competitor_benchmarks")
      .select("*")
      .eq("id", competitorId)
      .eq("user_id", user.id)
      .single();

    if (!competitor) {
      return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
    }

    // Fetch user's business
    const { data: business } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Fetch user's reviews for metrics
    const { data: userReviews } = await supabase
      .from("reviews")
      .select("*")
      .eq("business_id", businessId);

    // Fetch competitor's reviews
    const { data: competitorReviews } = await supabase
      .from("competitor_reviews")
      .select("*")
      .eq("competitor_benchmark_id", competitorId);

    // Fetch competitor's topics
    const { data: competitorTopics } = await supabase
      .from("competitor_topics")
      .select("*")
      .eq("competitor_benchmark_id", competitorId)
      .order("mention_count", { ascending: false })
      .limit(5);

    // Calculate user's metrics
    const userReviewsArray = userReviews || [];
    const userAvgRating = userReviewsArray.length > 0
      ? (userReviewsArray.reduce((sum, r) => sum + r.rating, 0) / userReviewsArray.length).toFixed(1)
      : 0;

    const userPublishedCount = userReviewsArray.filter((r) => r.status === "published").length;
    const userResponseRate = userReviewsArray.length > 0
      ? Math.round((userPublishedCount / userReviewsArray.length) * 100)
      : 0;

    const userSentimentCounts = {
      positive: userReviewsArray.filter((r) => r.rating >= 4).length,
      mixed: userReviewsArray.filter((r) => r.rating === 3).length,
      negative: userReviewsArray.filter((r) => r.rating <= 2).length,
    };

    // Calculate competitor's response rate based on owner responses
    const competitorReviewsArray = competitorReviews || [];
    const competitorResponseCount = competitorReviewsArray.filter((r) => r.owner_response).length;
    const competitorResponseRate = competitorReviewsArray.length > 0
      ? Math.round((competitorResponseCount / competitorReviewsArray.length) * 100)
      : 0;

    // Get user's top topics from analytics cache
    const { data: userAnalytics } = await supabase
      .from("analytics_cache")
      .select("results")
      .eq("business_id", businessId)
      .eq("analysis_type", "category")
      .single();

    const userTopTopics = userAnalytics?.results?.topics?.slice(0, 5).map((t: any) => t.topic) || [];

    // Get competitor's recent reviews
    const competitorRecentReviews = (competitorReviews || [])
      .sort((a, b) => new Date(b.review_date || 0).getTime() - new Date(a.review_date || 0).getTime())
      .slice(0, 5);

    // Get user's recent reviews
    const userRecentReviews = userReviewsArray
      .sort((a, b) => new Date(b.review_date || 0).getTime() - new Date(a.review_date || 0).getTime())
      .slice(0, 5);

    // Generate insights
    const insights = await generateHeadToHeadInsights(
      {
        name: business.name,
        avgRating: parseFloat(userAvgRating as string),
        totalReviews: userReviewsArray.length,
        responseRate: userResponseRate,
        positiveCount: userSentimentCounts.positive,
        negativeCount: userSentimentCounts.negative,
        topTopics: userTopTopics,
      },
      {
        name: competitor.competitor_name,
        avgRating: competitor.avg_rating || 0,
        totalReviews: competitor.total_reviews || 0,
        responseRate: competitor.response_rate || 0,
        positiveCount: competitor.positive_count,
        negativeCount: competitor.negative_count,
        topTopics: (competitorTopics || []).map((t) => t.topic),
      }
    );

    return NextResponse.json({
      yourBusiness: {
        name: business.name,
        avgRating: parseFloat(userAvgRating as string),
        totalReviews: userReviewsArray.length,
        responseRate: userResponseRate,
        sentimentBreakdown: userSentimentCounts,
        topTopics: userTopTopics,
        recentReviews: userRecentReviews.map((r) => ({
          id: r.id,
          author: r.author_name,
          rating: r.rating,
          text: r.review_text,
          date: r.review_date,
        })),
      },
      competitor: {
        name: competitor.competitor_name,
        location: competitor.competitor_location,
        avgRating: competitor.avg_rating,
        totalReviews: competitor.total_reviews,
        responseRate: competitorResponseRate,
        sentimentBreakdown: {
          positive: competitor.positive_count,
          mixed: competitor.mixed_count,
          negative: competitor.negative_count,
        },
        topTopics: (competitorTopics || []).map((t) => ({
          topic: t.topic,
          mentions: t.mention_count,
          sentiment: t.sentiment_score,
        })),
        recentReviews: competitorRecentReviews.map((r) => ({
          id: r.id,
          author: r.author_name,
          rating: r.rating,
          text: r.review_text,
          date: r.review_date,
        })),
        lastSynced: competitor.last_synced_at,
      },
      insights,
    });
  } catch (err: unknown) {
    console.error("Head-to-head comparison error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
