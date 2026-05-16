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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editUrlValidating, setEditUrlValidating] = useState(false);
  const [editUrlValid, setEditUrlValid] = useState(false);
  const [editUrlValidationMsg, setEditUrlValidationMsg] = useState("");
  const [editLoading, setEditLoading] = useState(false);

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
          maxReviews: maxReviews,
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

  // Validate edit URL
  async function validateEditUrl() {
    if (!editUrl.trim()) {
      setEditUrlValidationMsg("Please enter a URL");
      setEditUrlValid(false);
      return;
    }

    setEditUrlValidating(true);
    setEditUrlValidationMsg("");

    try {
      const res = await fetch("/api/validate-google-maps-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: editUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditUrlValidationMsg(data.error || "Invalid Google Maps URL");
        setEditUrlValid(false);
        setEditUrlValidating(false);
        return;
      }

      setEditUrlValidationMsg(`✓ Location verified: ${data.businessName}`);
      setEditUrlValid(true);
      setEditUrlValidating(false);
    } catch (err) {
      setEditUrlValidationMsg("Failed to validate URL. Please try again.");
      setEditUrlValid(false);
      setEditUrlValidating(false);
    }
  }

  // Handle edit competitor URL
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;

    setEditLoading(true);

    const supabase = await import("@/lib/supabase/client").then(m => m.createClient());
    const { error: updateError } = await supabase
      .from("competitor_benchmarks")
      .update({ google_maps_url: editUrl })
      .eq("id", editingId);

    if (updateError) {
      alert("Failed to update URL: " + updateError.message);
      setEditLoading(false);
      return;
    }

    // Reload competitors
    await fetchCompetitors();

    setEditingId(null);
    setEditUrl("");
    setEditUrlValid(false);
    setEditUrlValidationMsg("");
    setEditLoading(false);
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
                        className="bg-slate-800/70 border border-slate-700 hover:border-indigo-500 rounded-xl p-6 transition-all duration-200 hover:bg-slate-800"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 cursor-pointer" onClick={() => {
                            setSelectedCompetitorId(competitor.id);
                            setView("comparison");
                          }}>
                            <h3 className="text-lg font-semibold text-white">{competitor.competitor_name}</h3>
                            {competitor.competitor_location && (
                              <p className="text-sm text-slate-400 mt-1">{competitor.competitor_location}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingId(competitor.id);
                                setEditUrl(competitor.google_maps_url || "");
                                setEditUrlValid(!!competitor.google_maps_url);
                              }}
                              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded text-xs font-medium transition-all duration-200"
                              title="Edit URL"
                            >
                              ✎ Edit
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCompetitorId(competitor.id);
                                setView("comparison");
                              }}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-all duration-200"
                            >
                              Compare →
                            </button>
                          </div>
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

      {/* Edit Competitor URL Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-white mb-2">Edit Google Maps URL</h2>
            <p className="text-slate-400 text-sm mb-6">
              Update the Google Maps URL for this competitor.
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Competitor name - Display only */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Competitor name
                </label>
                <div className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm">
                  {competitors.find((c) => c.id === editingId)?.competitor_name}
                </div>
                <p className="text-xs text-slate-500 mt-1">Cannot be changed</p>
              </div>

              {/* Google Maps URL - Editable */}
              <div>
                <label htmlFor="edit-competitor-url" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Google Maps URL
                </label>
                <div className="flex gap-2">
                  <input
                    id="edit-competitor-url"
                    type="url"
                    value={editUrl}
                    onChange={(e) => {
                      setEditUrl(e.target.value);
                      setEditUrlValid(false);
                      setEditUrlValidationMsg("");
                    }}
                    placeholder="https://www.google.com/maps/place/..."
                    className={`flex-1 bg-slate-900 border rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 ${
                      editUrlValid
                        ? "border-emerald-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        : "border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    }`}
                  />
                  {editUrl.trim() && !editUrlValid && (
                    <button
                      type="button"
                      onClick={validateEditUrl}
                      disabled={editUrlValidating}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap"
                    >
                      {editUrlValidating ? "Verifying..." : "Verify"}
                    </button>
                  )}
                </div>

                {editUrlValidationMsg && (
                  <p className={`text-xs mt-2 ${editUrlValid ? "text-emerald-400" : "text-red-400"}`}>
                    {editUrlValidationMsg}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setEditUrl("");
                    setEditUrlValid(false);
                    setEditUrlValidationMsg("");
                  }}
                  disabled={editLoading}
                  className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading || !editUrl.trim()}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  {editLoading ? "Saving..." : "Save URL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
