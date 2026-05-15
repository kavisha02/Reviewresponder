/**
 * API Route: POST /api/competitors/add
 *
 * Adds a new competitor to track for a business.
 * Validates tier limits and fetches initial competitor data using Apify.
 *
 * Request body: { businessId: string, competitorName: string, googleMapsUrl?: string, maxReviews?: number }
 * Response: { success: boolean, competitorId?: string, error?: string }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkCompetitorLimit } from "@/lib/competitors/tier-check";
import { fetchPlaceDetails, extractPlaceIdFromUrl, searchGooglePlace } from "@/lib/competitors/google-places";
import { fetchCompetitorReviewsFromApify, transformApifyReviewToCompetitorReview } from "@/lib/competitors/apify-reviews";
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
      console.log(`Extracted place ID from URL: ${placeId}`);
    }

    // If we have a place ID, fetch details
    if (placeId) {
      try {
        console.log(`Fetching place details for place ID: ${placeId}`);
        placeDetails = await fetchPlaceDetails(placeId);
        console.log(`Fetched place details:`, {
          name: placeDetails?.name,
          rating: placeDetails?.rating,
        });
      } catch (error) {
        console.error("Error fetching place details from URL:", error);
      }
    }

    // If no place details yet, search by name
    if (!placeDetails) {
      try {
        console.log(`Searching for competitor by name: ${competitorName}`);
        placeDetails = await searchGooglePlace(competitorName);
        if (placeDetails) {
          placeId = placeDetails.place_id;
          console.log(`Found place:`, {
            name: placeDetails.name,
            rating: placeDetails.rating,
          });
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

    console.log(`Created competitor benchmark: ${competitor.id}`);

    // Fetch reviews using Apify if we have a Google Maps URL
    if (googleMapsUrl) {
      try {
        console.log(`Fetching reviews from Apify for URL: ${googleMapsUrl}`);
        const apifyReviews = await fetchCompetitorReviewsFromApify(googleMapsUrl, maxReviews);

        if (apifyReviews && apifyReviews.length > 0) {
          console.log(`Apify returned ${apifyReviews.length} reviews`);

          // Transform reviews to our schema
          const reviewsToInsert: Partial<CompetitorReview>[] = apifyReviews.map((review) =>
            transformApifyReviewToCompetitorReview(review, competitor.id, placeId)
          );

          // Insert reviews first (without sentiment/topics)
          if (reviewsToInsert.length > 0) {
            console.log(`Inserting ${reviewsToInsert.length} reviews into database`);
            const { error: insertError } = await supabase
              .from("competitor_reviews")
              .insert(reviewsToInsert);

            if (insertError) {
              console.error("Error inserting reviews:", insertError);
            } else {
              console.log(`Successfully inserted ${reviewsToInsert.length} reviews`);

              // Analyze sentiment for each review
              console.log(`Analyzing sentiment for ${apifyReviews.length} reviews...`);
              const reviewsWithSentiment: Partial<CompetitorReview>[] = [];

              for (const review of apifyReviews) {
                try {
                  const sentiment = await analyzeSingleReviewSentiment(review.text || "");
                  reviewsWithSentiment.push({
                    external_id: review.reviewId || review.id || `apify_${review.publishedAtDate}`,
                    sentiment: sentiment.sentiment,
                    topics: sentiment.topics,
                  });
                } catch (error) {
                  console.error("Error analyzing review sentiment:", error);
                  reviewsWithSentiment.push({
                    external_id: review.reviewId || review.id || `apify_${review.publishedAtDate}`,
                    sentiment: "mixed",
                    topics: [],
                  });
                }
              }

              // Update reviews with sentiment data
              console.log(`Updating ${reviewsWithSentiment.length} reviews with sentiment data`);
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
                console.log(`Extracting topics from reviews...`);
                const topicAnalysis = await extractTopicsFromReviews(
                  reviewsToInsert as CompetitorReview[]
                );

                // Store topics
                if (topicAnalysis.topics && topicAnalysis.topics.length > 0) {
                  console.log(`Found ${topicAnalysis.topics.length} topics`);
                  const topicsToInsert = topicAnalysis.topics.map((t) => ({
                    competitor_benchmark_id: competitor.id,
                    topic: t.topic,
                    mention_count: t.mention_count,
                    sentiment_score: t.sentiment_score,
                  }));

                  await supabase
                    .from("competitor_topics")
                    .insert(topicsToInsert);

                  console.log(`Inserted ${topicsToInsert.length} topics`);
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

              console.log(`Sentiment breakdown:`, sentimentCounts);

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
          }
        } else {
          console.warn(`No reviews returned from Apify`);
        }
      } catch (error) {
        console.error("Error fetching reviews from Apify:", error);
        // Continue even if Apify fails - competitor is still created
      }
    } else {
      console.warn(`No Google Maps URL provided - skipping Apify review fetch`);
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
