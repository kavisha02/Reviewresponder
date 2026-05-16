"use client";

import { useState, useEffect } from "react";

interface HeadToHeadData {
  yourBusiness: {
    name: string;
    avgRating: number;
    totalReviews: number;
    responseRate: number;
    sentimentBreakdown: { positive: number; mixed: number; negative: number };
    topTopics: string[];
    recentReviews: Array<{
      id: string;
      author: string | null;
      rating: number;
      text: string | null;
      date: string | null;
    }>;
  };
  competitor: {
    name: string;
    location: string | null;
    avgRating: number | null;
    totalReviews: number | null;
    responseRate: number | null;
    sentimentBreakdown: { positive: number; mixed: number; negative: number };
    topTopics: Array<{ topic: string; mentions: number; sentiment: number | null }>;
    recentReviews: Array<{
      id: string;
      author: string | null;
      rating: number | null;
      text: string | null;
      date: string | null;
    }>;
    lastSynced: string | null;
  };
  insights: string[];
}

interface HeadToHeadComparisonProps {
  competitorId: string;
  businessId: string;
  competitorName: string;
  onRefresh?: () => void;
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className={`flex gap-0.5 ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= Math.round(rating) ? "text-yellow-400" : "text-slate-700"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function HeadToHeadComparison({
  competitorId,
  businessId,
  competitorName,
  onRefresh,
}: HeadToHeadComparisonProps) {
  const [data, setData] = useState<HeadToHeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [competitorId, businessId]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/competitors/${competitorId}/head-to-head?businessId=${businessId}`
      );
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to load comparison data");
        return;
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch(`/api/competitors/${competitorId}/sync`, {
        method: "POST",
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to sync");
        return;
      }

      await fetchData();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading comparison data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-4 py-3 text-red-300">
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const yourSentimentTotal = data.yourBusiness.sentimentBreakdown.positive +
    data.yourBusiness.sentimentBreakdown.mixed +
    data.yourBusiness.sentimentBreakdown.negative;

  const competitorSentimentTotal = data.competitor.sentimentBreakdown.positive +
    data.competitor.sentimentBreakdown.mixed +
    data.competitor.sentimentBreakdown.negative;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Head-to-Head Comparison</h2>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all duration-200"
        >
          {syncing ? "Syncing..." : "Refresh"}
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your Business Card */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{data.yourBusiness.name}</h3>

          <div className="space-y-4">
            {/* Rating */}
            <div>
              <p className="text-slate-400 text-sm mb-1">Average Rating</p>
              <div className="flex items-center gap-2">
                <StarRating rating={data.yourBusiness.avgRating} size="lg" />
                <span className="text-2xl font-bold text-white">
                  {data.yourBusiness.avgRating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Reviews */}
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Reviews</p>
              <p className="text-2xl font-bold text-white">{data.yourBusiness.totalReviews}</p>
            </div>

            {/* Response Rate */}
            <div>
              <p className="text-slate-400 text-sm mb-1">Response Rate</p>
              <p className="text-2xl font-bold text-emerald-400">{data.yourBusiness.responseRate}%</p>
            </div>
          </div>
        </div>

        {/* Competitor Card */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{data.competitor.name}</h3>
              {data.competitor.location && (
                <p className="text-slate-400 text-sm">{data.competitor.location}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Rating */}
            <div>
              <p className="text-slate-400 text-sm mb-1">Average Rating</p>
              <div className="flex items-center gap-2">
                <StarRating rating={data.competitor.avgRating || 0} size="lg" />
                <span className="text-2xl font-bold text-white">
                  {data.competitor.avgRating?.toFixed(1) || "N/A"}
                </span>
              </div>
            </div>

            {/* Reviews */}
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Reviews</p>
              <p className="text-2xl font-bold text-white">{data.competitor.totalReviews || 0}</p>
            </div>

            {/* Response Rate */}
            <div>
              <p className="text-slate-400 text-sm mb-1">Response Rate</p>
              <p className="text-2xl font-bold text-slate-400">
                {data.competitor.responseRate ? `${data.competitor.responseRate}%` : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your Sentiment */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-6">
          <h4 className="font-semibold text-white mb-4">Sentiment Breakdown</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-emerald-400">Positive</span>
                <span className="text-slate-400">
                  {data.yourBusiness.sentimentBreakdown.positive} (
                  {yourSentimentTotal > 0
                    ? Math.round(
                        (data.yourBusiness.sentimentBreakdown.positive / yourSentimentTotal) * 100
                      )
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: `${
                      yourSentimentTotal > 0
                        ? (data.yourBusiness.sentimentBreakdown.positive / yourSentimentTotal) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-yellow-400">Mixed</span>
                <span className="text-slate-400">
                  {data.yourBusiness.sentimentBreakdown.mixed} (
                  {yourSentimentTotal > 0
                    ? Math.round(
                        (data.yourBusiness.sentimentBreakdown.mixed / yourSentimentTotal) * 100
                      )
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{
                    width: `${
                      yourSentimentTotal > 0
                        ? (data.yourBusiness.sentimentBreakdown.mixed / yourSentimentTotal) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-400">Negative</span>
                <span className="text-slate-400">
                  {data.yourBusiness.sentimentBreakdown.negative} (
                  {yourSentimentTotal > 0
                    ? Math.round(
                        (data.yourBusiness.sentimentBreakdown.negative / yourSentimentTotal) * 100
                      )
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${
                      yourSentimentTotal > 0
                        ? (data.yourBusiness.sentimentBreakdown.negative / yourSentimentTotal) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Competitor Sentiment */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-6">
          <h4 className="font-semibold text-white mb-4">Sentiment Breakdown</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-emerald-400">Positive</span>
                <span className="text-slate-400">
                  {data.competitor.sentimentBreakdown.positive} (
                  {competitorSentimentTotal > 0
                    ? Math.round(
                        (data.competitor.sentimentBreakdown.positive / competitorSentimentTotal) * 100
                      )
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: `${
                      competitorSentimentTotal > 0
                        ? (data.competitor.sentimentBreakdown.positive / competitorSentimentTotal) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-yellow-400">Mixed</span>
                <span className="text-slate-400">
                  {data.competitor.sentimentBreakdown.mixed} (
                  {competitorSentimentTotal > 0
                    ? Math.round(
                        (data.competitor.sentimentBreakdown.mixed / competitorSentimentTotal) * 100
                      )
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{
                    width: `${
                      competitorSentimentTotal > 0
                        ? (data.competitor.sentimentBreakdown.mixed / competitorSentimentTotal) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-400">Negative</span>
                <span className="text-slate-400">
                  {data.competitor.sentimentBreakdown.negative} (
                  {competitorSentimentTotal > 0
                    ? Math.round(
                        (data.competitor.sentimentBreakdown.negative / competitorSentimentTotal) * 100
                      )
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${
                      competitorSentimentTotal > 0
                        ? (data.competitor.sentimentBreakdown.negative / competitorSentimentTotal) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your Topics */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-6">
          <h4 className="font-semibold text-white mb-4">Top Topics</h4>
          <div className="space-y-2">
            {data.yourBusiness.topTopics.length > 0 ? (
              data.yourBusiness.topTopics.map((topic, idx) => (
                <div key={idx} className="flex items-center gap-2 text-slate-300">
                  <span className="text-indigo-400">•</span>
                  <span>{topic}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No topics extracted yet</p>
            )}
          </div>
        </div>

        {/* Competitor Topics */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-6">
          <h4 className="font-semibold text-white mb-4">Top Topics</h4>
          <div className="space-y-2">
            {data.competitor.topTopics.length > 0 ? (
              data.competitor.topTopics.map((topic, idx) => (
                <div key={idx} className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400">•</span>
                    <span>{topic.topic}</span>
                  </div>
                  <span className="text-xs text-slate-500">{topic.mentions} mentions</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No topics extracted yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Competitive Insights */}
      {data.insights.length > 0 && (
        <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-6">
          <h4 className="font-semibold text-white mb-4">💡 Competitive Insights</h4>
          <ul className="space-y-2">
            {data.insights.map((insight, idx) => (
              <li key={idx} className="flex gap-3 text-slate-300 text-sm">
                <span className="text-indigo-400 flex-shrink-0">→</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your Recent Reviews */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-6">
          <h4 className="font-semibold text-white mb-4">Recent Reviews</h4>
          <div className="space-y-3">
            {data.yourBusiness.recentReviews.length > 0 ? (
              data.yourBusiness.recentReviews.map((review) => (
                <div key={review.id} className="border-l-2 border-indigo-500 pl-3 py-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">
                      {review.author || "Anonymous"}
                    </span>
                    <span className="text-yellow-400">{"★".repeat(review.rating)}</span>
                  </div>
                  <p className="text-xs text-slate-400">{timeAgo(review.date)}</p>
                  {review.text && (
                    <p className="text-sm text-slate-300 mt-1 line-clamp-2">{review.text}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No reviews yet</p>
            )}
          </div>
        </div>

        {/* Competitor Recent Reviews */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-6">
          <h4 className="font-semibold text-white mb-4">Recent Reviews</h4>
          <div className="space-y-3">
            {data.competitor.recentReviews.length > 0 ? (
              data.competitor.recentReviews.map((review) => (
                <div key={review.id} className="border-l-2 border-slate-600 pl-3 py-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">
                      {review.author || "Anonymous"}
                    </span>
                    {review.rating && (
                      <span className="text-yellow-400">{"★".repeat(review.rating)}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{timeAgo(review.date)}</p>
                  {review.text && (
                    <p className="text-sm text-slate-300 mt-1 line-clamp-2">{review.text}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No reviews yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Last Synced */}
      {data.competitor.lastSynced && (
        <p className="text-xs text-slate-500 text-center">
          Last synced: {new Date(data.competitor.lastSynced).toLocaleString()}
        </p>
      )}
    </div>
  );
}
