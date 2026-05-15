/**
 * API Route: POST /api/competitors/add
 *
 * Adds a new competitor to track for a business.
 * Validates tier limits and fetches initial competitor data.
 *
 * Request body: { businessId: string, competitorName: string, googleMapsUrl?: string }
 * Response: { success: boolean, competitorId?: string, error?: string }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkCompetitorLimit } from "@/lib/competitors/tier-check";
import { fetchPlaceDetails, extractPlaceIdFromUrl } from "@/lib/competitors/google-places";
import { extractTopicsFromReviews, analyzeSingleReviewSentiment } from "@/lib/competitors/gemini-analysis";
import { CompetitorReview } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, competitorName, googleMapsUrl } = await request.json();

    if (!businessId || !competitorName) {
      return NextResponse.json(
        { error: "businessId and competitorName are required" },
        { status: 400 }
      );
    }

    // Verify business belongs to user
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Check tier limit
    const tierCheck = await checkCompetitorLimit(user.id, businessId);
    if (!tierCheck.allowed) {
      return NextResponse.json(
        { error: tierCheck.reason },
        { status: 403 }
      );
    }

    // Extract place ID from URL or search by name
    let placeId: string | null = null;
    let placeDetails = null;

    if (googleMapsUrl) {
      placeId = extractPlaceIdFromUrl(googleMapsUrl);
    }

    if (!placeId) {
      // Search by competitor name
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(competitorName)}&key=${process.env.GOOGLE_PLACES_API_KEY}`
        );
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          placeId = data.results[0].place_id;
        }
      } catch (error) {
        console.error("Error searching for competitor:", error);
      }
    }

    // Fetch place details if we have a place ID
    if (placeId) {
      try {
        placeDetails = await fetchPlaceDetails(placeId);
      } catch (error) {
        console.error("Error fetching place details:", error);
      }
    }

    // Create competitor benchmark record
    const { data: competitor, error: createError } = await supabase
      .from("competitor_benchmarks")
      .insert({
        user_id: user.id,
        business_id: businessId,
        competitor_name: placeDetails?.name || competitorName,
        competitor_location: placeDetails?.formatted_address || null,
        google_maps_url: googleMapsUrl || null,
        google_place_id: placeId || null,
        avg_rating: placeDetails?.rating || null,
        total_reviews: placeDetails?.user_ratings_total || null,
        response_rate: null,
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating competitor:", createError);
      return NextResponse.json(
        { error: "Failed to create competitor" },
        { status: 500 }
      );
    }

    // Fetch and store reviews if we have place details
    if (placeDetails && placeDetails.reviews && placeDetails.reviews.length > 0) {
      try {
        // Transform reviews to our schema
        const reviewsToInsert: Partial<CompetitorReview>[] = [];

        for (const review of placeDetails.reviews.slice(0, 50)) {
          const sentiment = await analyzeSingleReviewSentiment(review.text);

          reviewsToInsert.push({
            competitor_benchmark_id: competitor.id,
            external_id: `${placeId}_${review.time}`,
            author_name: review.author_name,
            rating: review.rating,
            review_text: review.text,
            review_date: new Date(review.time * 1000).toISOString(),
            sentiment: sentiment.sentiment,
            topics: sentiment.topics,
          });
        }

        // Insert reviews
        if (reviewsToInsert.length > 0) {
          await supabase
            .from("competitor_reviews")
            .insert(reviewsToInsert);

          // Extract topics from all reviews
          const topicAnalysis = await extractTopicsFromReviews(
            reviewsToInsert as CompetitorReview[]
          );

          // Store topics
          if (topicAnalysis.topics && topicAnalysis.topics.length > 0) {
            const topicsToInsert = topicAnalysis.topics.map((t) => ({
              competitor_benchmark_id: competitor.id,
              topic: t.topic,
              mention_count: t.mention_count,
              sentiment_score: t.sentiment_score,
            }));

            await supabase
              .from("competitor_topics")
              .insert(topicsToInsert);
          }

          // Calculate sentiment breakdown
          const sentimentCounts = {
            positive: reviewsToInsert.filter((r) => r.sentiment === "positive").length,
            mixed: reviewsToInsert.filter((r) => r.sentiment === "mixed").length,
            negative: reviewsToInsert.filter((r) => r.sentiment === "negative").length,
          };

          // Update competitor benchmark with sentiment data
          await supabase
            .from("competitor_benchmarks")
            .update({
              positive_count: sentimentCounts.positive,
              mixed_count: sentimentCounts.mixed,
              negative_count: sentimentCounts.negative,
            })
            .eq("id", competitor.id);
        }
      } catch (error) {
        console.error("Error processing competitor reviews:", error);
        // Continue even if review processing fails
      }
    }

    return NextResponse.json({
      success: true,
      competitorId: competitor.id,
      message: "Competitor added successfully",
    });
  } catch (err: unknown) {
    console.error("Add competitor error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
