/**
 * Tier enforcement for competitor limits
 */

import { createClient } from "@/lib/supabase/server";

export async function checkCompetitorLimit(
  userId: string,
  businessId: string
): Promise<{ allowed: boolean; reason?: string; currentCount: number; limit: number }> {
  const supabase = await createClient();

  // Get user's subscription tier
  const { data: subData } = await supabase
    .from("user_subscriptions")
    .select("plan_id")
    .eq("user_id", userId)
    .single();

  const planId = subData?.plan_id || "free";

  let limit = 1; // Default/Starter
  if (planId === "pro") limit = 3;
  if (planId === "elite") limit = 999999; // Unlimited

  // Get current competitor count for this business
  const { count } = await supabase
    .from("competitor_benchmarks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("business_id", businessId);

  const currentCount = count || 0;

  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `You have reached the maximum number of competitors (${limit}) for your ${planId.toUpperCase()} plan. Please upgrade to add more.`,
      currentCount,
      limit,
    };
  }

  return { allowed: true, currentCount, limit };
}
