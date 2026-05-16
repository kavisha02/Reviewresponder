"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import HeadToHeadComparison from "@/components/HeadToHeadComparison";
import CompetitorSelectModal from "@/components/CompetitorSelectModal";
import { CompetitorBenchmark } from "@/lib/types";

export default function HeadToHeadPage() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get("business");

  const [competitors, setCompetitors] = useState<CompetitorBenchmark[]>([]);
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isAddingCompetitor, setIsAddingCompetitor] = useState(false);
  const [tierLimit, setTierLimit] = useState(3);
  const [currentCount, setCurrentCount] = useState(0);
  const [view, setView] = useState<"list" | "comparison">("list");

  useEffect(() => {
    if (businessId) {
      fetchCompetitors();
    }
  }, [businessId]);

  async function fetchCompetitors() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/competitors/list?businessId=${businessId}`);
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to load competitors");
        return;
      }

      setCompetitors(result.competitors || []);
      setCurrentCount(result.competitors?.length || 0);

      // Set first competitor as selected if available
      if (result.competitors && result.competitors.length > 0) {
        setSelectedCompetitorId(result.competitors[0].id);
        setView("comparison");
      } else {
        setView("list");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load competitors");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCompetitor(competitorName: string, googleMapsUrl?: string, maxReviews?: number) {
    setIsAddingCompetitor(true);
    try {
      const res = await fetch("/api/competitors/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          competitorName,
          googleMapsUrl,
          maxReviews: maxReviews || 50,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to add competitor");
      }

      // Refresh competitors list
      await fetchCompetitors();
      setSelectedCompetitorId(result.competitorId);
      setShowModal(false);
      setView("comparison");
    } catch (err) {
      throw err;
    } finally {
      setIsAddingCompetitor(false);
    }
  }

  async function handleRemoveCompetitor() {
    if (!selectedCompetitorId) return;

    if (!confirm("Are you sure you want to remove this competitor?")) {
      return;
    }

    try {
      const res = await fetch(`/api/competitors/${selectedCompetitorId}/delete`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setError("Failed to remove competitor");
        return;
      }

      await fetchCompetitors();
      setSelectedCompetitorId(null);
      setView("list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove competitor");
    }
  }

  if (!businessId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">No business selected</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const selectedCompetitor = competitors.find((c) => c.id === selectedCompetitorId);

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reputation Scorecard</h1>
          <p className="text-slate-400">
            Compare your business reputation against competitors in your market.
          </p>
        </div>

        {view === "list" ? (
          <>
            {/* Competitors List */}
            <div className="space-y-4 mb-8">
              {competitors.length > 0 ? (
                <>
                  <h2 className="text-lg font-semibold text-white mb-4">Your Competitors</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {competitors.map((competitor) => (
                      <div
                        key={competitor.id}
                        onClick={() => {
                          setSelectedCompetitorId(competitor.id);
                          setView("comparison");
                        }}
                        className="bg-slate-800/70 border border-slate-700 hover:border-indigo-500 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:bg-slate-800"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">{competitor.competitor_name}</h3>
                            {competitor.competitor_location && (
                              <p className="text-sm text-slate-400 mt-1">{competitor.competitor_location}</p>
                            )}
                          </div>
                          <div className="text-indigo-400 text-xl">→</div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Rating</p>
                            <p className="text-white font-semibold">
                              {competitor.avg_rating?.toFixed(1) || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Reviews</p>
                            <p className="text-white font-semibold">{competitor.total_reviews || 0}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Response</p>
                            <p className="text-white font-semibold">{competitor.response_rate || 0}%</p>
                          </div>
                        </div>

                        {/* Sentiment breakdown */}
                        <div className="mt-4 flex gap-2">
                          <div className="flex-1 bg-emerald-500/20 rounded px-2 py-1 text-center">
                            <p className="text-xs text-emerald-300">{competitor.positive_count || 0}</p>
                          </div>
                          <div className="flex-1 bg-yellow-500/20 rounded px-2 py-1 text-center">
                            <p className="text-xs text-yellow-300">{competitor.mixed_count || 0}</p>
                          </div>
                          <div className="flex-1 bg-red-500/20 rounded px-2 py-1 text-center">
                            <p className="text-xs text-red-300">{competitor.negative_count || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-12 text-center">
                  <p className="text-slate-400 mb-4">No competitors added yet. Add one to get started!</p>
                </div>
              )}
            </div>

            {/* Add Competitor Button */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg font-semibold transition-all duration-200"
            >
              {competitors.length === 0 ? "Add Your First Competitor" : "+ Add Another Competitor"}
            </button>

            {/* Tier Limit Warning */}
            {currentCount >= tierLimit && (
              <div className="bg-yellow-950/50 border border-yellow-700/50 rounded-lg px-4 py-3 mt-6 text-yellow-300 text-sm">
                You've reached the limit of {tierLimit} competitors for your tier. Upgrade to Pro for unlimited competitors.
              </div>
            )}
          </>
        ) : (
          <>
            {/* Back to list button */}
            <button
              onClick={() => setView("list")}
              className="mb-6 px-4 py-2 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-all duration-200"
            >
              ← Back to Competitors
            </button>

            {/* Comparison View */}
            {selectedCompetitor ? (
              <HeadToHeadComparison
                competitorId={selectedCompetitor.id}
                businessId={businessId}
                competitorName={selectedCompetitor.competitor_name}
                onRemove={handleRemoveCompetitor}
                onRefresh={fetchCompetitors}
              />
            ) : null}
          </>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-4 py-3 mt-6 text-red-300">
            {error}
          </div>
        )}
      </div>

      {/* Add Competitor Modal */}
      <CompetitorSelectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAddCompetitor}
        isLoading={isAddingCompetitor}
        tierLimit={tierLimit}
        currentCount={currentCount}
      />
    </main>
  );
}
