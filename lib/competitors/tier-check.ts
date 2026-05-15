/**
 * Tier enforcement for competitor limits
 */

import { createClient } from "@/lib/supabase/server";

export async function checkCompetitorLimit(
  userId: string,
  businessId: string
): Promise<{ allowed: boolean; reason?: string; currentCount: number; limit: number }> {
  const supabase = await createClient();

  // Get user's subscription tier (default to free)
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", userId)
    .single();

  const tier = profile?.subscription_tier || "free";

  // Get current competitor count for this business
  const { count } = await supabase
    .from("competitor_benchmarks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("business_id", businessId);

  const currentCount = count || 0;

  // Check limits based on tier
  if (tier === "free" && currentCount >= 3) {
    return {
      allowed: false,
      reason: "Free tier limited to 3 competitors. Upgrade to Pro for unlimited.",
      currentCount,
      limit: 3,
    };
  }

  if (tier === "pro" && currentCount >= 50) {
    return {
      allowed: false,
      reason: "Maximum 50 competitors per business.",
      currentCount,
      limit: 50,
    };
  }

  const limit = tier === "free" ? 3 : 50;
  return { allowed: true, currentCount, limit };
}
