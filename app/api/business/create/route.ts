/**
 * API Route: POST /api/business/create
 *
 * Called when a user connects their business for the first time.
 * Creates a row in the `businesses` table for this user.
 *
 * Request body: { name, businessType, googleMapsUrl }
 * Response:     { businessId }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify the user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, businessType, googleMapsUrl } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    // Create the business record
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert({
        user_id:         user.id,
        name:            name.trim(),
        business_type:   businessType || null,
        google_maps_url: googleMapsUrl?.trim() || null,
      })
      .select()
      .single();

    if (businessError) {
      console.error("Business insert error:", businessError);
      return NextResponse.json({ error: businessError.message }, { status: 500 });
    }

    return NextResponse.json({ businessId: business.id });

  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
