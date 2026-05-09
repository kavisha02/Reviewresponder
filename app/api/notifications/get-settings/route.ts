/**
 * API Route: GET /api/notifications/get-settings
 *
 * Fetches user notification preferences from database.
 *
 * Query params: businessId
 * Response: notification settings object
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
      );
    }

    // Verify business ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("id, user_id")
      .eq("id", businessId)
      .single();

    if (!business || business.user_id !== user.id) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Fetch notification settings
    const { data: settings, error } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found, which is fine
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 }
      );
    }

    // Return settings or defaults if not found
    return NextResponse.json(
      settings || {
        negative_alerts_enabled: true,
        weekly_digest_enabled: true,
        digest_day: "monday",
        digest_time: "09:00:00",
        notification_email: user.email,
      }
    );

  } catch (err) {
    console.error("Get settings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
