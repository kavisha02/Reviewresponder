/**
 * API Route: POST /api/notifications/update-settings
 *
 * Saves user notification preferences.
 * For now, just returns success without saving to DB (table doesn't exist yet).
 * Can be extended later when notification_settings table is created.
 *
 * Request body: {
 *   businessId: string,
 *   negativeAlerts: boolean,
 *   weeklyDigest: boolean,
 *   digestDay: string,
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
      weeklyDigest,
      digestDay,
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

    // TODO: Save to notification_settings table once it's created
    // For now, just validate and return success
    console.log("Notification settings:", {
      userId: user.id,
      businessId,
      negativeAlerts,
      weeklyDigest,
      digestDay,
      digestTime,
      email,
    });

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

