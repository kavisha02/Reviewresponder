/**
 * Deep Analysis Page — /dashboard/analyse-deeply?business=<id>
 *
 * Comprehensive analysis dashboard with:
 * - Location overview (summary, services, customer sentiment)
 * - Category-based analysis (topics with sentiment)
 * - Sentiment breakdown (positive, negative, mixed)
 * - Featured top 3 positive reviews
 * - Professional visualizations and charts
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Business, Review } from "@/lib/types";
import DeepAnalysisClient from "@/components/DeepAnalysisClient";

interface PageProps {
  searchParams: Promise<{ business?: string }>;
}

export default async function DeepAnalysisPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch all businesses
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true }) as { data: Business[] | null };

  if (!businesses?.length) redirect("/dashboard/setup");

  // Get selected business
  const selectedId = params.business
    ? businesses.find((b) => b.id === params.business)?.id ?? businesses[0].id
    : businesses[0].id;

  const business = businesses.find((b) => b.id === selectedId) ?? businesses[0];

  // Fetch reviews for this business
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("business_id", selectedId)
    .order("review_date", { ascending: false }) as { data: Review[] | null };

  return (
    <main className="text-slate-100">

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Deep Analysis</h1>
          <p className="text-slate-400">
            Comprehensive insights for <span className="text-indigo-400 font-semibold">{business.name}</span>
          </p>
        </div>

        {/* Client Component with all analysis */}
        <DeepAnalysisClient businessId={selectedId} reviews={reviews || []} business={business} />
      </div>
    </main>
  );
}
