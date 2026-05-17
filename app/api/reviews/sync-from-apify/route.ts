import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ApifyClient } from "apify-client";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR_ID = "Xb8osYTtOjlsgI6k9";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, maxReviews } = await request.json();

    if (!businessId || !maxReviews) {
      return NextResponse.json(
        { error: "businessId and maxReviews are required" },
        { status: 400 }
      );
    }

    if (!APIFY_API_TOKEN) {
      return NextResponse.json(
        { error: "Apify API token not configured" },
        { status: 500 }
      );
    }

    // Verify ownership and get business with google_maps_url
    const { data: business } = await supabase
      .from("businesses")
      .select("id, google_maps_url")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (!business.google_maps_url) {
      return NextResponse.json(
        { error: "Google Maps URL not set for this business" },
        { status: 400 }
      );
    }

    const reviewLimit = Math.min(maxReviews, 500);

    console.log(`Fetching ${reviewLimit} reviews from Apify for business: ${businessId}`);

    const client = new ApifyClient({ token: APIFY_API_TOKEN });

    const input = {
      startUrls: [{ url: business.google_maps_url }],
      maxReviews: reviewLimit,
      reviewsSort: "newest",
      language: "en",
      personalData: true,
    };

    const run = await client.actor(APIFY_ACTOR_ID).call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: true, count: 0, message: "No reviews found" },
        { status: 200 }
      );
    }

    const totalPlatformReviews = items[0]?.reviewsCount || items.length;
    const totalPlatformRating = items[0]?.totalScore;

    const updateData: any = { total_platform_reviews: totalPlatformReviews };
    if (totalPlatformRating !== undefined) {
      updateData.total_platform_rating = totalPlatformRating;
    }

    // Update business with true total reviews count
    await supabase
      .from("businesses")
      .update(updateData)
      .eq("id", businessId);

    // Transform Apify reviews to our format
    // console.log(items);
    const reviewsToInsert = items.map((item: any) => {
      const ownerResponse = item.ownerResponse || item.responseFromOwnerText || item.ownerReply || null;
      return {
        business_id: businessId,
        platform: "google",
        external_id: item.reviewId || item.id || `apify_${item.publishedAtDate}`,
        author_name: item.name || item.reviewerName || item.reviewer || item.author || "Anonymous",
        author_photo_url: item.reviewerPhotoUrl || item.reviewerPhoto || item.authorPhoto || null,
        rating: item.stars || item.rating || 5,
        review_text: item.text || item.reviewText || item.content || null,
        review_date: item.publishedAtDate || item.publishedAt || item.date || new Date().toISOString(),
        is_local_guide: item.isLocalGuide || false,
        reviewer_review_count: item.reviewerNumberOfReviews || 0,
        likes_count: item.likesCount || 0,
        has_photos: item.reviewImageUrls && Array.isArray(item.reviewImageUrls) ? item.reviewImageUrls.length > 0 : false,
        owner_response: ownerResponse,
        owner_response_date: item.ownerResponseDate || item.responseFromOwnerDate || item.ownerReplyDate || null,
        status: ownerResponse && ownerResponse.trim().length > 0 ? "responded" : "new",
      };
    });

    // Check for duplicates before inserting
    const existingExternalIds = reviewsToInsert.map((r) => r.external_id);

    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("external_id")
      .eq("business_id", businessId)
      .in("external_id", existingExternalIds);

    const existingIds = new Set(existingReviews?.map((r) => r.external_id) || []);
    const newReviews = reviewsToInsert.filter((r) => !existingIds.has(r.external_id));
    
    // Find existing reviews that have an owner response now
    const existingReviewsData = reviewsToInsert.filter((r) => existingIds.has(r.external_id) && r.owner_response);

    // Update existing reviews with their new owner response if present
    if (existingReviewsData.length > 0) {
      for (const review of existingReviewsData) {
        await supabase
          .from("reviews")
          .update({
            owner_response: review.owner_response,
            owner_response_date: review.owner_response_date,
            status: "responded"
          })
          .eq("business_id", businessId)
          .eq("external_id", review.external_id);
      }
    }

    if (newReviews.length === 0) {
      return NextResponse.json(
        { success: true, count: 0, message: "All reviews already synced, but updated existing ones if they had new owner responses." },
        { status: 200 }
      );
    }

    // Insert new reviews into database
    const { error: insertError, data: inserted } = await supabase
      .from("reviews")
      .insert(newReviews)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Send negative review alerts for new negative reviews
    if (inserted && inserted.length > 0) {
      const negativeReviews = inserted.filter((r: any) => r.rating <= 2);

      for (const review of negativeReviews) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send-negative-alert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessId,
              reviewId: review.id,
            }),
          });
        } catch (alertError) {
          console.error("Failed to send negative alert:", alertError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: inserted?.length || 0,
      message: `Successfully synced ${inserted?.length || 0} review${inserted?.length !== 1 ? "s" : ""} from Google Maps`,
    });

  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
