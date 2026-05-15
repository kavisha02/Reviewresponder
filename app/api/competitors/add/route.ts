/**
 * API Route: POST /api/competitors/add
 *
 * Adds a new competitor to track for a business.
 * Validates tier limits and fetches initial competitor data.
 *
 * Request body: { businessId: string, competitorName: string, googleMapsUrl?: string, maxReviews?: number }
 * Response: { success: boolean, competitorId?: string, error?: string }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkCompetitorLimit } from "@/lib/competitors/tier-check";
import { fetchPlaceDetails, extractPlaceIdFromUrl, searchGooglePlace } from "@/lib/competitors/google-places";
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

    const { businessId, competitorName, googleMapsUrl, maxReviews = 50 } = await request.json();

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

    // If we have a place ID, fetch details
    if (placeId) {
      try {
        placeDetails = await fetchPlaceDetails(placeId);
      } catch (error) {
        console.error("Error fetching place details from URL:", error);
      }
    }

    // If no place details yet, search by name
    if (!placeDetails) {
      try {
        placeDetails = await searchGooglePlace(competitorName);
        if (placeDetails) {
          placeId = placeDetails.place_id;
        }
      } catch (error) {
        console.error("Error searching for competitor:", error);
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
        // Transform reviews to our schema (limit to maxReviews)
        const reviewsToInsert: Partial<CompetitorReview>[] = [];
        const reviewsToAnalyze: any[] = [];

        for (const review of placeDetails.reviews.slice(0, Math.min(maxReviews, placeDetails.reviews.length))) {
          reviewsToAnalyze.push(review);
          reviewsToInsert.push({
            competitor_benchmark_id: competitor.id,
            external_id: `${placeId}_${review.time}`,
            author_name: review.author_name,
            rating: review.rating,
            review_text: review.text,
            review_date: new Date(review.time * 1000).toISOString(),
            sentiment: null,
            topics: null,
          });
        }

        // Insert reviews first (without sentiment/topics)
        if (reviewsToInsert.length > 0) {
          await supabase
            .from("competitor_reviews")
            .insert(reviewsToInsert);

          // Analyze sentiment for each review
          console.log(`Analyzing sentiment for ${reviewsToAnalyze.length} reviews...`);
          const reviewsWithSentiment: Partial<CompetitorReview>[] = [];

          for (const review of reviewsToAnalyze) {
            try {
              const sentiment = await analyzeSingleReviewSentiment(review.text);
              reviewsWithSentiment.push({
                external_id: `${placeId}_${review.time}`,
                sentiment: sentiment.sentiment,
                topics: sentiment.topics,
              });
            } catch (error) {
              console.error("Error analyzing review sentiment:", error);
              reviewsWithSentiment.push({
                external_id: `${placeId}_${review.time}`,
                sentiment: "mixed",
                topics: [],
              });
            }
          }

          // Update reviews with sentiment data
          for (const review of reviewsWithSentiment) {
            await supabase
              .from("competitor_reviews")
              .update({
                sentiment: review.sentiment,
                topics: review.topics,
              })
              .eq("competitor_benchmark_id", competitor.id)
              .eq("external_id", review.external_id);
          }

          // Extract topics from all reviews
          try {
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
          } catch (error) {
            console.error("Error extracting topics:", error);
          }

          // Calculate sentiment breakdown
          const sentimentCounts = {
            positive: reviewsWithSentiment.filter((r) => r.sentiment === "positive").length,
            mixed: reviewsWithSentiment.filter((r) => r.sentiment === "mixed").length,
            negative: reviewsWithSentiment.filter((r) => r.sentiment === "negative").length,
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

          console.log(`Successfully added ${reviewsToInsert.length} reviews for competitor`);
        }
      } catch (error) {
        console.error("Error processing competitor reviews:", error);
        // Continue even if review processing fails
      }
    } else {
      console.warn("No reviews found for competitor or place details unavailable");
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
