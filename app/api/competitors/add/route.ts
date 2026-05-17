/**
 * API Route: POST /api/competitors/add
 *
 * Adds a new competitor to track for a business.
 * Validates tier limits and fetches initial competitor data using Apify.
 *
 * Request body: { businessId: string, competitorName: string, googleMapsUrl: string, maxReviews?: number }
 * Response: { success: boolean, competitorId?: string, error?: string }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkCompetitorLimit } from "@/lib/competitors/tier-check";
import { fetchCompetitorReviewsFromApify, transformApifyReviewToCompetitorReview } from "@/lib/competitors/apify-reviews";
import { extractTopicsFromReviews, analyzeBatchReviewSentiment } from "@/lib/competitors/gemini-analysis";
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

    if (!googleMapsUrl) {
      return NextResponse.json(
        { error: "Google Maps URL is required to fetch reviews" },
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

    console.log(`Adding competitor: ${competitorName} for business ${businessId}`);
    console.log(`Fetching reviews from Apify for URL: ${googleMapsUrl}`);

    // Fetch reviews from Apify
    let apifyReviews;
    try {
      apifyReviews = await fetchCompetitorReviewsFromApify(googleMapsUrl, maxReviews);
      console.log(`Apify returned ${apifyReviews.length} reviews`);
    } catch (apifyError) {
      console.error("Apify fetch error:", apifyError);
      return NextResponse.json(
        { error: `Failed to fetch reviews from Apify: ${apifyError instanceof Error ? apifyError.message : "Unknown error"}` },
        { status: 500 }
      );
    }

    if (!apifyReviews || apifyReviews.length === 0) {
      return NextResponse.json(
        { error: "No reviews found for this competitor. Please check the Google Maps URL." },
        { status: 400 }
      );
    }

    // Create competitor benchmark record
    const totalPlatformReviews = apifyReviews[0]?.reviewsCount || apifyReviews.length;
    
    const { data: competitor, error: createError } = await supabase
      .from("competitor_benchmarks")
      .insert({
        user_id: user.id,
        business_id: businessId,
        competitor_name: competitorName,
        google_maps_url: googleMapsUrl,
        last_synced_at: new Date().toISOString(),
        total_platform_reviews: totalPlatformReviews,
        total_platform_rating: apifyReviews[0]?.totalScore || null,
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

    // Transform reviews to our schema
    const reviewsToInsert: Partial<CompetitorReview>[] = apifyReviews.map((review) =>
      transformApifyReviewToCompetitorReview(review, competitor.id, null, user.id)
    );

    console.log(`Transformed ${reviewsToInsert.length} reviews`);
    console.log(`Transformed review sample:`, reviewsToInsert[0]);

    // Insert reviews first (without sentiment/topics)
    if (reviewsToInsert.length > 0) {
      console.log(`Inserting ${reviewsToInsert.length} reviews into database`);
      const { error: insertError, data: insertedData } = await supabase
        .from("competitor_reviews")
        .insert(reviewsToInsert)
        .select();

      if (insertError) {
        console.error("Error inserting reviews:", insertError);
        console.error("Insert error details:", {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
        });
        return NextResponse.json(
          { error: `Failed to insert reviews: ${insertError.message}` },
          { status: 500 }
        );
      }

      console.log(`Successfully inserted ${reviewsToInsert.length} reviews`);
      console.log(`Inserted data sample:`, insertedData?.[0]);

      // Analyze sentiment for each review (non-blocking - don't wait)
      console.log(`Starting sentiment analysis for ${apifyReviews.length} reviews...`);

      // Run sentiment analysis in background without blocking
      (async () => {
        try {
          const reviewsWithSentiment: Partial<CompetitorReview>[] = [];

          // Group reviews into chunks of 10 to avoid payload limits and spread out rate limits
          const chunkSize = 10;
          for (let i = 0; i < apifyReviews.length; i += chunkSize) {
            const chunk = apifyReviews.slice(i, i + chunkSize);
            console.log(`Analyzing sentiment for chunk ${i / chunkSize + 1} of ${Math.ceil(apifyReviews.length / chunkSize)}...`);
            
            const batchInput = chunk.map(r => ({
              id: r.reviewId || r.id || `apify_${r.publishedAtDate}`,
              text: r.text || "",
              rating: r.stars || r.rating
            }));

            try {
              const batchResults = await analyzeBatchReviewSentiment(batchInput);
              
              for (const result of batchResults) {
                reviewsWithSentiment.push({
                  external_id: result.id,
                  sentiment: result.sentiment,
                  topics: result.topics || [],
                });
              }
            } catch (error) {
              console.error("Error analyzing batch sentiment:", error);
              for (const r of batchInput) {
                reviewsWithSentiment.push({
                  external_id: r.id,
                  sentiment: "mixed",
                  topics: [],
                });
              }
            }

            // Wait 5 seconds between chunks to stay well within 15 RPM free tier limit
            if (i + chunkSize < apifyReviews.length) {
              await new Promise(resolve => setTimeout(resolve, 5000));
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
            console.log(`Topic analysis result:`, topicAnalysis);

            // Store topics
            if (topicAnalysis.topics && topicAnalysis.topics.length > 0) {
              console.log(`Found ${topicAnalysis.topics.length} topics`);
              const topicsToInsert = topicAnalysis.topics.map((t) => ({
                competitor_benchmark_id: competitor.id,
                topic: t.topic,
                mention_count: t.mention_count,
                sentiment_score: t.sentiment_score,
                user_id: user.id,
              }));

              const { error: topicError } = await supabase
                .from("competitor_topics")
                .insert(topicsToInsert);

              if (topicError) {
                console.error("Error inserting topics:", topicError);
              } else {
                console.log(`Inserted ${topicsToInsert.length} topics`);
              }
            } else {
              console.log(`No topics found in analysis`);
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

          console.log(`Background sentiment analysis completed`);
        } catch (error) {
          console.error("Background sentiment analysis failed:", error);
        }
      })();

      // Calculate average rating from reviews (do this immediately)
      const avgRating = reviewsToInsert.length > 0
        ? (reviewsToInsert.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsToInsert.length).toFixed(2)
        : null;

      console.log(`Average rating: ${avgRating}`);

      // Update competitor benchmark with metrics (do this immediately)
      await supabase
        .from("competitor_benchmarks")
        .update({
          avg_rating: avgRating ? parseFloat(avgRating) : null,
          total_reviews: reviewsToInsert.length,
        })
        .eq("id", competitor.id);

      console.log(`Successfully added ${reviewsToInsert.length} reviews for competitor`);
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
