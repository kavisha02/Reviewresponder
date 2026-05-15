/**
 * Head-to-Head Comparison Page — /dashboard/competitors/head-to-head
 *
 * Allows users to compare their business against a single competitor.
 * Shows side-by-side metrics, sentiment breakdown, topics, and AI insights.
 */

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

        {/* Competitor Selector */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex-1">
            <label htmlFor="competitor" className="block text-sm font-medium text-slate-300 mb-2">
              Select Competitor
            </label>
            <select
              id="competitor"
              value={selectedCompetitorId || ""}
              onChange={(e) => setSelectedCompetitorId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-white text-sm outline-none transition-all duration-200"
            >
              <option value="">Choose a competitor...</option>
              {competitors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.competitor_name} {c.competitor_location ? `(${c.competitor_location})` : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="mt-6 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all duration-200"
          >
            + Add Competitor
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-4 py-3 mb-6 text-red-300">
            {error}
          </div>
        )}

        {/* Tier Limit Warning */}
        {currentCount >= tierLimit && (
          <div className="bg-yellow-950/50 border border-yellow-700/50 rounded-lg px-4 py-3 mb-6 text-yellow-300 text-sm">
            You've reached the limit of {tierLimit} competitors for your tier. Upgrade to Pro for unlimited competitors.
          </div>
        )}

        {/* Comparison View */}
        {selectedCompetitor ? (
          <HeadToHeadComparison
            competitorId={selectedCompetitor.id}
            businessId={businessId}
            competitorName={selectedCompetitor.competitor_name}
            onRemove={handleRemoveCompetitor}
            onRefresh={fetchCompetitors}
          />
        ) : (
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-12 text-center">
            <p className="text-slate-400 mb-4">
              {competitors.length === 0
                ? "No competitors added yet. Add one to get started!"
                : "Select a competitor to view the comparison."}
            </p>
            {competitors.length === 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all duration-200"
              >
                Add Your First Competitor
              </button>
            )}
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
