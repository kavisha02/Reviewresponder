"use client";

import { useState, useEffect } from "react";

interface Snapshot {
  date: string;
  totalReviews: number;
  avgRating: number | null;
}

interface CompetitorEntry {
  id: string;
  name: string;
  location: string | null;
  avgRating: number;
  totalReviews: number;
  responseRate: number;
  positive: number;
  mixed: number;
  negative: number;
  topTopics: string[];
  lastSynced: string | null;
  snapshots: Snapshot[];
  rank: number;
}

interface YourBusiness {
  name: string;
  avgRating: number;
  totalReviews: number;
  responseRate: number;
  positive: number;
  mixed: number;
  negative: number;
  rank: number;
}

interface OverviewData {
  yourBusiness: YourBusiness;
  competitors: CompetitorEntry[];
  recommendations: string[];
}

interface SyncModalState {
  competitorId: string;
  competitorName: string;
  count: number;
}

const RANK_BADGES: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
}

export default function MultiCompetitorDashboard({ businessId }: { businessId: string }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingRecs, setGeneratingRecs] = useState(false);
  const [recsGenerated, setRecsGenerated] = useState(false);
  const [syncModal, setSyncModal] = useState<SyncModalState | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [businessId]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/competitors/overview?businessId=${businessId}`);
      const result = await res.json();
      if (!res.ok) { setError(result.error || "Failed to load overview"); return; }
      setData(result);
      if (result.recommendations?.length > 0) setRecsGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateRecs() {
    setGeneratingRecs(true);
    setError("");
    try {
      const res = await fetch("/api/competitors/overview/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.error || "Failed to generate recommendations"); return; }
      setData((prev) => prev ? { ...prev, recommendations: result.recommendations } : null);
      setRecsGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate recommendations");
    } finally {
      setGeneratingRecs(false);
    }
  }

  async function handleSync(competitorId: string, count: number) {
    setSyncing(true);
    try {
      const res = await fetch(`/api/competitors/${competitorId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxReviews: count }),
      });
      if (!res.ok) { const r = await res.json(); setError(r.error || "Sync failed"); return; }
      setSyncModal(null);
      setRecsGenerated(false); // Reset recs when new data arrives
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="text-slate-400">Loading competitor overview...</div>
    </div>
  );

  if (error) return (
    <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-4 py-3 text-red-300">{error}</div>
  );

  if (!data) return null;

  const { yourBusiness, competitors } = data;
  const hasCompetitors = competitors.length > 0;

  // All participants for leaderboard (your biz + all competitors)
  const allParticipants = [
    { ...yourBusiness, id: "you", isYou: true },
    ...competitors.map((c) => ({ ...c, isYou: false })),
  ].sort((a, b) => a.rank - b.rank);

  // Best value per metric row (for highlighting)
  const bestRating = Math.max(yourBusiness.avgRating, ...competitors.map((c) => c.avgRating));
  const bestReviews = Math.max(yourBusiness.totalReviews, ...competitors.map((c) => c.totalReviews));
  const bestResponse = Math.max(yourBusiness.responseRate, ...competitors.map((c) => c.responseRate));

  // All snapshots merged for trends table
  const allSnapshots = competitors.flatMap((c) =>
    c.snapshots.map((s) => ({ ...s, competitorName: c.name }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Competitor Overview</h1>
          <p className="text-slate-400">All competitors tracked for {yourBusiness.name} — rankings, trends, and AI-powered growth recommendations.</p>
        </div>

        {!hasCompetitors && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-12 text-center">
            <p className="text-slate-400 mb-2">No competitors added yet.</p>
            <p className="text-slate-500 text-sm">Add competitors from the <a href={`/dashboard/competitors/head-to-head?business=${businessId}`} className="text-indigo-400 hover:underline">Reputation Scorecard</a>.</p>
          </div>
        )}

        {hasCompetitors && (
          <>
            {/* ── A. LEADERBOARD ── */}
            <section className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">Leaderboard</h2>
                <p className="text-slate-400 text-sm">Ranked by average rating, then total reviews</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                      <th className="px-4 py-3 text-left">Rank</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-right">Rating</th>
                      <th className="px-4 py-3 text-right">Reviews</th>
                      <th className="px-4 py-3 text-right">Response Rate</th>
                      <th className="px-4 py-3 text-right">Positive %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allParticipants.map((p) => {
                      const total = p.positive + p.mixed + p.negative;
                      const positivePct = total > 0 ? Math.round((p.positive / total) * 100) : 0;
                      return (
                        <tr
                          key={p.id}
                          className={`border-b border-slate-700/50 transition-colors ${p.isYou ? "bg-indigo-950/40 border-l-2 border-l-indigo-500" : "hover:bg-slate-800/40"}`}
                        >
                          <td className="px-4 py-3 font-bold text-white">
                            {RANK_BADGES[p.rank] || `#${p.rank}`}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={p.isYou ? "text-indigo-300 font-semibold" : "text-white"}>
                                {p.name}
                              </span>
                              {p.isYou && <span className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded">You</span>}
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold ${p.avgRating === bestRating ? "text-emerald-400" : "text-slate-300"}`}>
                            {p.avgRating > 0 ? `${p.avgRating.toFixed(1)} ★` : "N/A"}
                          </td>
                          <td className={`px-4 py-3 text-right ${p.totalReviews === bestReviews ? "text-emerald-400 font-semibold" : "text-slate-300"}`}>
                            {p.totalReviews}
                          </td>
                          <td className={`px-4 py-3 text-right ${p.responseRate === bestResponse ? "text-emerald-400 font-semibold" : "text-slate-300"}`}>
                            {p.responseRate}%
                          </td>
                          <td className="px-4 py-3 text-right text-slate-300">{positivePct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── B. SIDE-BY-SIDE METRICS ── */}
            <section className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">Side-by-Side Comparison</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                      <th className="px-4 py-3 text-left w-32">Metric</th>
                      <th className="px-4 py-3 text-center bg-indigo-950/30">
                        <div className="text-indigo-300 font-semibold">{yourBusiness.name}</div>
                        <div className="text-indigo-500 text-xs">You</div>
                      </th>
                      {competitors.slice(0, 4).map((c) => (
                        <th key={c.id} className="px-4 py-3 text-center">
                          <div className="text-white font-medium truncate max-w-[120px]">{c.name}</div>
                          {c.location && <div className="text-slate-500 text-xs truncate max-w-[120px]">{c.location}</div>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        label: "Avg Rating",
                        values: [yourBusiness.avgRating, ...competitors.slice(0, 4).map((c) => c.avgRating)],
                        format: (v: number) => v > 0 ? `${v.toFixed(1)} ★` : "N/A",
                        bestFn: (vals: number[]) => Math.max(...vals),
                      },
                      {
                        label: "Total Reviews",
                        values: [yourBusiness.totalReviews, ...competitors.slice(0, 4).map((c) => c.totalReviews)],
                        format: (v: number) => String(v),
                        bestFn: (vals: number[]) => Math.max(...vals),
                      },
                      {
                        label: "Response Rate",
                        values: [yourBusiness.responseRate, ...competitors.slice(0, 4).map((c) => c.responseRate)],
                        format: (v: number) => `${v}%`,
                        bestFn: (vals: number[]) => Math.max(...vals),
                      },
                      {
                        label: "Positive",
                        values: [yourBusiness.positive, ...competitors.slice(0, 4).map((c) => c.positive)],
                        format: (v: number) => String(v),
                        bestFn: (vals: number[]) => Math.max(...vals),
                      },
                      {
                        label: "Mixed",
                        values: [yourBusiness.mixed, ...competitors.slice(0, 4).map((c) => c.mixed)],
                        format: (v: number) => String(v),
                        bestFn: () => -Infinity, // no "best" for mixed
                      },
                      {
                        label: "Negative",
                        values: [yourBusiness.negative, ...competitors.slice(0, 4).map((c) => c.negative)],
                        format: (v: number) => String(v),
                        bestFn: (vals: number[]) => Math.min(...vals), // lowest negative is best
                      },
                    ].map((row, rowIdx) => {
                      const best = row.bestFn(row.values);
                      return (
                        <tr key={row.label} className={`border-b border-slate-700/50 ${rowIdx % 2 === 0 ? "" : "bg-slate-900/20"}`}>
                          <td className="px-4 py-3 text-slate-400 font-medium text-xs uppercase">{row.label}</td>
                          {row.values.map((val, colIdx) => (
                            <td
                              key={colIdx}
                              className={`px-4 py-3 text-center font-semibold ${
                                colIdx === 0 ? "bg-indigo-950/20" : ""
                              } ${val === best && best !== -Infinity ? "text-emerald-400" : "text-slate-300"}`}
                            >
                              {row.format(val)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                    <tr className="border-b border-slate-700/50 bg-slate-900/20">
                      <td className="px-4 py-3 text-slate-400 font-medium text-xs uppercase">Top Topics</td>
                      <td className="px-4 py-3 text-center text-slate-500 bg-indigo-950/20 text-xs">—</td>
                      {competitors.slice(0, 4).map((c) => (
                        <td key={c.id} className="px-4 py-3 text-center">
                          <div className="flex flex-wrap justify-center gap-1">
                            {c.topTopics.slice(0, 3).map((t) => (
                              <span key={t} className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{t}</span>
                            ))}
                            {c.topTopics.length === 0 && <span className="text-slate-500 text-xs">None yet</span>}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── C. PERFORMANCE TRENDS ── */}
            <section className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">Performance Trends</h2>
                <p className="text-slate-400 text-sm">Historical snapshots from syncs — most recent first</p>
              </div>
              {allSnapshots.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500">
                  No snapshots yet. Sync reviews for a competitor to start tracking trends.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                        <th className="px-4 py-3 text-left">Competitor</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-right">Total Reviews</th>
                        <th className="px-4 py-3 text-right">Avg Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allSnapshots.map((s, i) => (
                        <tr key={i} className={`border-b border-slate-700/50 ${i % 2 === 0 ? "" : "bg-slate-900/20"}`}>
                          <td className="px-4 py-3 text-white font-medium">{s.competitorName}</td>
                          <td className="px-4 py-3 text-slate-400">{formatDate(s.date)}</td>
                          <td className="px-4 py-3 text-right text-slate-300">{s.totalReviews}</td>
                          <td className="px-4 py-3 text-right text-yellow-400">
                            {s.avgRating != null ? `${s.avgRating.toFixed(1)} ★` : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ── D. PER-COMPETITOR SYNC ── */}
            <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-1">Sync Reviews</h2>
              <p className="text-slate-400 text-sm mb-5">Each competitor's reviews are synced independently.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {competitors.map((c) => (
                  <div key={c.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="text-white font-medium text-sm">{c.name}</p>
                        {c.location && <p className="text-slate-500 text-xs">{c.location}</p>}
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">{timeAgo(c.lastSynced)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                      <span>{c.totalReviews} reviews</span>
                      <span>·</span>
                      <span>{c.avgRating > 0 ? `${c.avgRating.toFixed(1)} ★` : "No rating"}</span>
                    </div>
                    <button
                      onClick={() => setSyncModal({ competitorId: c.id, competitorName: c.name, count: 1 })}
                      className="w-full px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-all"
                    >
                      Sync Reviews
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* ── E. AI RECOMMENDATIONS ── */}
            {!recsGenerated ? (
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-2">🤖 AI Growth Recommendations</h4>
                    <p className="text-slate-400 text-sm">
                      Get 4-5 AI-generated insights to outperform all your competitors simultaneously. Based on ratings, reviews, sentiment, and response rates across your entire competitive landscape.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateRecs}
                    disabled={generatingRecs}
                    className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap"
                  >
                    {generatingRecs ? "Generating..." : "Generate Recommendations"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-6">
                <h4 className="font-semibold text-white mb-4">💡 AI Growth Recommendations</h4>
                <ul className="space-y-3">
                  {data.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-3 text-slate-300 text-sm">
                      <span className="text-indigo-400 flex-shrink-0 font-bold">{idx + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">{error}</div>
        )}
      </div>

      {/* Sync Modal */}
      {syncModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-white mb-1">Sync Reviews</h2>
            <p className="text-slate-400 text-sm mb-6">{syncModal.competitorName}</p>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">Number of Reviews</label>
                  <span className="text-sm font-bold text-indigo-400">{syncModal.count}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={syncModal.count}
                  onChange={(e) => setSyncModal({ ...syncModal, count: parseInt(e.target.value) })}
                  disabled={syncing}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setSyncModal(null)}
                  disabled={syncing}
                  className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSync(syncModal.competitorId, syncModal.count)}
                  disabled={syncing}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  {syncing ? "Syncing..." : `Sync ${syncModal.count} Review${syncModal.count !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
