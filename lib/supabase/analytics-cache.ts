import { createClient } from "@/lib/supabase/client";

export type AnalysisType = "category" | "sentiment" | "insights" | "summary";

interface CacheEntry {
  id: string;
  business_id: string;
  user_id: string;
  analysis_type: AnalysisType;
  results: unknown;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export async function getCachedAnalysis(businessId: string, analysisType: AnalysisType) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("analytics_cache")
      .select("*")
      .eq("business_id", businessId)
      .eq("analysis_type", analysisType)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      console.error("Error fetching cached analysis:", error);
      return null;
    }

    return data as CacheEntry;
  } catch (err) {
    console.error("Error in getCachedAnalysis:", err);
    return null;
  }
}

export async function saveCachedAnalysis(
  businessId: string,
  analysisType: AnalysisType,
  results: unknown,
  reviewCount: number
) {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("No authenticated user found for cache save");
      return null;
    }

    const { data, error } = await supabase
      .from("analytics_cache")
      .upsert(
        {
          business_id: businessId,
          user_id: user.id,
          analysis_type: analysisType,
          results,
          review_count: reviewCount,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "business_id,analysis_type",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving cached analysis:", error);
      return null;
    }

    return data as CacheEntry;
  } catch (err) {
    console.error("Error in saveCachedAnalysis:", err);
    return null;
  }
}

export function isAnalysisCacheStale(cache: CacheEntry | null, currentReviewCount: number): boolean {
  if (!cache) return true;
  return cache.review_count !== currentReviewCount;
}
