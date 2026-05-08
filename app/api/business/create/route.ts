/**
 * API Route: POST /api/business/create
 *
 * Called when a user connects their business for the first time.
 * Does two things:
 *  1. Creates a row in the `businesses` table for this user
 *  2. Seeds 28 diverse mock reviews so the dashboard has rich data to show
 *
 * In a future phase, step 2 will be replaced with a live Google API call.
 *
 * Request body: { name, businessType }
 * Response:     { businessId }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMockReviews } from "@/lib/mock-reviews";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify the user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, businessType } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    // Create the business record
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert({
        user_id:       user.id,
        name:          name.trim(),
        business_type: businessType || null,
      })
      .select()
      .single();

    if (businessError) {
      console.error("Business insert error:", businessError);
      return NextResponse.json({ error: businessError.message }, { status: 500 });
    }

    // Seed mock reviews for this business
    const { error: reviewsError } = await supabase
      .from("reviews")
      .insert(getMockReviews(business.id));

    if (reviewsError) {
      console.error("Reviews seed error:", reviewsError);
      // Business was created — don't fail the whole request over reviews
      return NextResponse.json({ businessId: business.id, warning: "Reviews not seeded" });
    }

    return NextResponse.json({ businessId: business.id });

  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
