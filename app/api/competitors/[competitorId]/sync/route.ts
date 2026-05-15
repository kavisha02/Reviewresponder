/**
 * API Route: POST /api/competitors/:competitorId/sync
 *
 * Manually triggers a sync of competitor reviews and metrics.
 *
 * Response: { success: boolean, reviewsAdded: number, message: string }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchPlaceDetails } from "@/lib/competitors/google-places";
import { extractTopicsFromReviews, analyzeSingleReviewSentiment } from "@/lib/competitors/gemini-analysis";
import { CompetitorReview } from "@/lib/types";

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

    if (!competitor.google_place_id) {
      return NextResponse.json(
        { error: "Competitor does not have a Google Place ID" },
        { status: 400 }
      );
    }

    // Fetch latest place details
    const placeDetails = await fetchPlaceDetails(competitor.google_place_id);
    if (!placeDetails) {
      return NextResponse.json(
        { error: "Could not fetch competitor data from Google Places" },
        { status: 500 }
      );
    }

    // Get existing review IDs to avoid duplicates
    const { data: existingReviews } = await supabase
      .from("competitor_reviews")
      .select("external_id")
      .eq("competitor_benchmark_id", competitorId);

    const existingIds = new Set(existingReviews?.map((r) => r.external_id) || []);

    // Process new reviews
    const newReviews: Partial<CompetitorReview>[] = [];
    let reviewsAdded = 0;

    for (const review of placeDetails.reviews || []) {
      const externalId = `${competitor.google_place_id}_${review.time}`;

      if (!existingIds.has(externalId)) {
        const sentiment = await analyzeSingleReviewSentiment(review.text);

        newReviews.push({
          competitor_benchmark_id: competitorId,
          external_id: externalId,
          author_name: review.author_name,
          rating: review.rating,
          review_text: review.text,
          review_date: new Date(review.time * 1000).toISOString(),
          sentiment: sentiment.sentiment,
          topics: sentiment.topics,
        });

        reviewsAdded++;
      }
    }

    // Insert new reviews
    if (newReviews.length > 0) {
      await supabase
        .from("competitor_reviews")
        .insert(newReviews);
    }

    // Recalculate metrics from all reviews
    const { data: allReviews } = await supabase
      .from("competitor_reviews")
      .select("*")
      .eq("competitor_benchmark_id", competitorId);

    const sentimentCounts = {
      positive: (allReviews || []).filter((r) => r.sentiment === "positive").length,
      mixed: (allReviews || []).filter((r) => r.sentiment === "mixed").length,
      negative: (allReviews || []).filter((r) => r.sentiment === "negative").length,
    };

    // Extract topics from all reviews
    const topicAnalysis = await extractTopicsFromReviews(allReviews as CompetitorReview[]);

    // Update topics
    if (topicAnalysis.topics && topicAnalysis.topics.length > 0) {
      // Delete old topics
      await supabase
        .from("competitor_topics")
        .delete()
        .eq("competitor_benchmark_id", competitorId);

      // Insert new topics
      const topicsToInsert = topicAnalysis.topics.map((t) => ({
        competitor_benchmark_id: competitorId,
        topic: t.topic,
        mention_count: t.mention_count,
        sentiment_score: t.sentiment_score,
      }));

      await supabase
        .from("competitor_topics")
        .insert(topicsToInsert);
    }

    // Create snapshot for trend tracking
    await supabase
      .from("competitor_snapshots")
      .insert({
        competitor_benchmark_id: competitorId,
        avg_rating: placeDetails.rating,
        total_reviews: placeDetails.user_ratings_total,
        response_rate: competitor.response_rate,
        positive_count: sentimentCounts.positive,
        mixed_count: sentimentCounts.mixed,
        negative_count: sentimentCounts.negative,
        reviews_last_30_days: (allReviews || []).length,
      });

    // Update competitor benchmark
    await supabase
      .from("competitor_benchmarks")
      .update({
        avg_rating: placeDetails.rating,
        total_reviews: placeDetails.user_ratings_total,
        positive_count: sentimentCounts.positive,
        mixed_count: sentimentCounts.mixed,
        negative_count: sentimentCounts.negative,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", competitorId);

    return NextResponse.json({
      success: true,
      reviewsAdded,
      message: `Synced ${reviewsAdded} new reviews`,
    });
  } catch (err: unknown) {
    console.error("Sync competitor error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
