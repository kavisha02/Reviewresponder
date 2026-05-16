/**
 * API Route: POST /api/competitors/:competitorId/sync
 *
 * Manually triggers a sync of competitor reviews and metrics using Apify.
 *
 * Response: { success: boolean, reviewsAdded: number, message: string }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCompetitorReviewsFromApify, transformApifyReviewToCompetitorReview } from "@/lib/competitors/apify-reviews";
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

    // Get maxReviews from request body (default to 100)
    const body = await request.json().catch(() => ({}));
    let maxReviews = body.maxReviews || 100;

    // Validate maxReviews is between 1 and 100
    maxReviews = Math.min(Math.max(parseInt(maxReviews) || 100, 1), 100);

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

    if (!competitor.google_maps_url) {
      return NextResponse.json(
        { error: "Competitor does not have a Google Maps URL" },
        { status: 400 }
      );
    }

    console.log(`Syncing reviews for competitor ${competitorId} from URL: ${competitor.google_maps_url}`);

    // Fetch reviews from Apify
    let apifyReviews;
    try {
      apifyReviews = await fetchCompetitorReviewsFromApify(competitor.google_maps_url, maxReviews);
      console.log(`Apify returned ${apifyReviews.length} reviews`);
    } catch (apifyError) {
      console.error("Apify fetch error:", apifyError);
      return NextResponse.json(
        { error: `Failed to fetch reviews from Apify: ${apifyError instanceof Error ? apifyError.message : "Unknown error"}` },
        { status: 500 }
      );
    }

    if (!apifyReviews || apifyReviews.length === 0) {
      return NextResponse.json({
        success: true,
        reviewsAdded: 0,
        message: "No new reviews found",
      });
    }

    // Get existing review IDs to avoid duplicates
    const { data: existingReviews } = await supabase
      .from("competitor_reviews")
      .select("external_id")
      .eq("competitor_benchmark_id", competitorId);

    const existingIds = new Set(existingReviews?.map((r) => r.external_id) || []);

    // Transform and filter new reviews
    const reviewsToInsert: Partial<CompetitorReview>[] = [];
    let reviewsAdded = 0;

    for (const review of apifyReviews) {
      const externalId = review.reviewId || review.id || `apify_${review.publishedAtDate}`;

      if (!existingIds.has(externalId)) {
        const transformed = transformApifyReviewToCompetitorReview(review, competitorId, competitor.google_place_id, user.id);
        reviewsToInsert.push(transformed);
        reviewsAdded++;
      }
    }

    console.log(`Found ${reviewsAdded} new reviews to insert`);

    // Insert new reviews
    if (reviewsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("competitor_reviews")
        .insert(reviewsToInsert);

      if (insertError) {
        console.error("Error inserting reviews:", insertError);
        throw insertError;
      }

      console.log(`Inserted ${reviewsToInsert.length} reviews`);

      // Analyze sentiment for all new reviews (only those with text)
      console.log(`Analyzing sentiment for ${reviewsToInsert.length} reviews...`);
      const reviewsWithSentiment: Partial<CompetitorReview>[] = [];

      for (const review of reviewsToInsert) {
        try {
          const sentiment = await analyzeSingleReviewSentiment(review.review_text || "", review.rating);
          reviewsWithSentiment.push({
            external_id: review.external_id,
            sentiment: sentiment.sentiment,
            topics: sentiment.topics,
          });
        } catch (error) {
          console.error("Error analyzing review sentiment:", error);
          reviewsWithSentiment.push({
            external_id: review.external_id,
            sentiment: "mixed",
            topics: [],
          });
        }
      }

      // Batch update reviews with sentiment data
      console.log(`Updating ${reviewsWithSentiment.length} reviews with sentiment data`);
      if (reviewsWithSentiment.length > 0) {
        const updatePromises = reviewsWithSentiment.map((review) =>
          supabase
            .from("competitor_reviews")
            .update({
              sentiment: review.sentiment,
              topics: review.topics,
            })
            .eq("competitor_benchmark_id", competitorId)
            .eq("external_id", review.external_id)
        );
        await Promise.all(updatePromises);
      }
    }

    // Recalculate metrics from all reviews
    const { data: allReviews } = await supabase
      .from("competitor_reviews")
      .select("*")
      .eq("competitor_benchmark_id", competitorId);

    const allReviewsArray = allReviews || [];
    const sentimentCounts = {
      positive: allReviewsArray.filter((r) => r.sentiment === "positive").length,
      mixed: allReviewsArray.filter((r) => r.sentiment === "mixed").length,
      negative: allReviewsArray.filter((r) => r.sentiment === "negative").length,
    };

    // Calculate response rate from owner responses
    const responseCount = allReviewsArray.filter((r) => r.owner_response).length;
    const responseRate = allReviewsArray.length > 0
      ? Math.round((responseCount / allReviewsArray.length) * 100)
      : 0;

    // Extract topics from all reviews
    const topicAnalysis = await extractTopicsFromReviews(allReviews as CompetitorReview[]);

    // Batch all final database operations
    const finalOperations = [];

    // Delete old topics and insert new ones
    if (topicAnalysis.topics && topicAnalysis.topics.length > 0) {
      finalOperations.push(
        supabase
          .from("competitor_topics")
          .delete()
          .eq("competitor_benchmark_id", competitorId)
      );

      const topicsToInsert = topicAnalysis.topics.map((t) => ({
        competitor_benchmark_id: competitorId,
        topic: t.topic,
        mention_count: t.mention_count,
        sentiment_score: t.sentiment_score,
        user_id: user.id,
      }));

      finalOperations.push(
        supabase
          .from("competitor_topics")
          .insert(topicsToInsert)
      );
    }

    // Create snapshot for trend tracking
    finalOperations.push(
      supabase
        .from("competitor_snapshots")
        .insert({
          competitor_benchmark_id: competitorId,
          avg_rating: competitor.avg_rating,
          total_reviews: allReviewsArray.length,
          response_rate: responseRate,
          positive_count: sentimentCounts.positive,
          mixed_count: sentimentCounts.mixed,
          negative_count: sentimentCounts.negative,
          reviews_last_30_days: allReviewsArray.length,
          user_id: user.id,
        })
    );

    // Update competitor benchmark
    finalOperations.push(
      supabase
        .from("competitor_benchmarks")
        .update({
          total_reviews: allReviewsArray.length,
          positive_count: sentimentCounts.positive,
          mixed_count: sentimentCounts.mixed,
          negative_count: sentimentCounts.negative,
          response_rate: responseRate,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", competitorId)
    );

    // Execute all final operations in parallel
    await Promise.all(finalOperations);

    console.log(`Sync completed. Added ${reviewsAdded} new reviews`);

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
