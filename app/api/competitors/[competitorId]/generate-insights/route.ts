/**
 * API Route: POST /api/competitors/:competitorId/generate-insights
 *
 * Generates AI-powered competitive insights comparing user's business with competitor.
 * Uses Gemini API to analyze metrics and provide actionable recommendations.
 *
 * Request body: { businessId: string }
 * Response: { insights: string[] }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";

export async function POST(
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

    const { businessId } = await request.json();

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
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

    const userPublishedCount = userReviewsArray.filter((r) => r.status === "responded").length;
    const userResponseRate = userReviewsArray.length > 0
      ? Math.round((userPublishedCount / userReviewsArray.length) * 100)
      : 0;

    const userSentimentCounts = {
      positive: userReviewsArray.filter((r) => r.rating >= 4).length,
      mixed: userReviewsArray.filter((r) => r.rating === 3).length,
      negative: userReviewsArray.filter((r) => r.rating <= 2).length,
    };

    // Calculate competitor's response rate
    const competitorReviewsArray = competitorReviews || [];
    const competitorResponseCount = competitorReviewsArray.filter((r) => r.owner_response).length;
    const competitorResponseRate = competitorReviewsArray.length > 0
      ? Math.round((competitorResponseCount / competitorReviewsArray.length) * 100)
      : 0;

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `Compare these two businesses and generate 3-5 actionable competitive insights.

Your Business (${business.name}):
- Rating: ${userAvgRating}/5.0
- Total Reviews: ${userReviewsArray.length}
- Response Rate: ${userResponseRate}%
- Positive Reviews: ${userSentimentCounts.positive}
- Negative Reviews: ${userSentimentCounts.negative}

Competitor (${competitor.competitor_name}):
- Rating: ${competitor.avg_rating || 0}/5.0
- Total Reviews: ${competitor.total_reviews || 0}
- Response Rate: ${competitorResponseRate}%
- Positive Reviews: ${competitor.positive_count}
- Negative Reviews: ${competitor.negative_count}
- Top Topics: ${(competitorTopics || []).map((t) => t.topic).join(", ") || "N/A"}

Generate insights as a JSON array of strings. Focus on:
1. Where you're winning/losing
2. Sentiment differences
3. Response rate comparison
4. Actionable recommendations

Return ONLY valid JSON array:
["insight 1", "insight 2", "insight 3"]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse insights" },
        { status: 500 }
      );
    }

    const insights = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      insights: Array.isArray(insights) ? insights : [],
    });

  } catch (err: unknown) {
    console.error("Generate insights error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
