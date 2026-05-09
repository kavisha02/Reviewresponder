/**
 * API Route: POST /api/notifications/update-settings
 *
 * Saves user notification preferences to a new notification_settings table.
 *
 * Request body: {
 *   businessId: string,
 *   negativeAlerts: boolean,
 *   dailyDigest: boolean,
 *   digestTime: string,
 *   email: string
 * }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      businessId,
      negativeAlerts,
      dailyDigest,
      digestTime,
      email,
    } = await request.json();

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

    // Upsert notification settings
    const { error } = await supabase
      .from("notification_settings")
      .upsert(
        {
          user_id: user.id,
          business_id: businessId,
          negative_alerts_enabled: negativeAlerts,
          daily_digest_enabled: dailyDigest,
          digest_time: digestTime,
          notification_email: email,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,business_id",
        }
      );

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
    });

  } catch (err) {
    console.error("Update settings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
