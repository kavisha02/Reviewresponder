"use client";

import { useState, useEffect } from "react";

interface HeadToHeadData {
  yourBusiness: {
    name: string;
    avgRating: number;
    fetchedAvgRating?: number;
    totalReviews: number;
    totalPlatformReviews: number;
    totalPlatformRating?: number;
    highImpactCount?: number;
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
    fetchedAvgRating?: number | null;
    totalReviews: number | null;
    totalPlatformReviews: number | null;
    totalPlatformRating?: number | null;
    highImpactCount?: number;
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
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [insightsGenerated, setInsightsGenerated] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncCount, setSyncCount] = useState(1);
  const [generatingSentiment, setGeneratingSentiment] = useState(false);
  const [sentimentGenerated, setSentimentGenerated] = useState(false);
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [topicsGenerated, setTopicsGenerated] = useState(false);
  const [totalReviewsOnLoad, setTotalReviewsOnLoad] = useState(0);

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
        setLoading(false);
        return;
      }

      // Auto-show sentiment if data already exists in DB
      const sentimentTotal =
        (result.competitor.sentimentBreakdown?.positive || 0) +
        (result.competitor.sentimentBreakdown?.mixed || 0) +
        (result.competitor.sentimentBreakdown?.negative || 0);
      if (sentimentTotal > 0) setSentimentGenerated(true);

      // Auto-show topics if data already exists in DB
      if (result.competitor.topTopics?.length > 0) setTopicsGenerated(true);

      // Auto-show insights if previously saved in DB
      if (result.insights?.length > 0) setInsightsGenerated(true);

      setData(result);

      // Check if reviews count changed (new reviews synced) — reset flags if so
      const currentTotalReviews = result.competitor.totalReviews || 0;
      if (totalReviewsOnLoad > 0 && currentTotalReviews > totalReviewsOnLoad) {
        setInsightsGenerated(false);
        setSentimentGenerated(false);
        setTopicsGenerated(false);
      }

      // Set initial review count on first load
      if (totalReviewsOnLoad === 0) {
        setTotalReviewsOnLoad(currentTotalReviews);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSync(reviewCount: number) {
    setSyncing(true);
    setError("");
    try {
      const res = await fetch(`/api/competitors/${competitorId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxReviews: reviewCount }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to sync");
        setSyncing(false);
        return;
      }

      await fetchData();
      setInsightsGenerated(false);
      setSentimentGenerated(false);
      setTopicsGenerated(false);
      localStorage.removeItem(`insights_${competitorId}`);
      setShowSyncModal(false);
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync");
    } finally {
      setSyncing(false);
    }
  }

  async function handleGenerateInsights() {
    setGeneratingInsights(true);
    setError("");
    try {
      const res = await fetch(`/api/competitors/${competitorId}/generate-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to generate insights");
        setGeneratingInsights(false);
        return;
      }

      // Update data with new insights
      setData((prevData) => prevData ? { ...prevData, insights: result.insights } : null);
      setInsightsGenerated(true);
      setGeneratingInsights(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate insights");
      setGeneratingInsights(false);
    }
  }

  async function handleGenerateSentiment() {
    if (sentimentGenerated) return;

    setGeneratingSentiment(true);
    setError("");
    try {
      const res = await fetch(`/api/competitors/${competitorId}/generate-sentiment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to generate sentiment");
        setGeneratingSentiment(false);
        return;
      }

      setData((prevData) => prevData ? {
        ...prevData,
        competitor: { ...prevData.competitor, sentimentBreakdown: result.sentiment }
      } : null);
      
      setSentimentGenerated(true);
      setGeneratingSentiment(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate sentiment");
      setGeneratingSentiment(false);
    }
  }

  async function handleGenerateTopics() {
    if (topicsGenerated) return;

    setGeneratingTopics(true);
    setError("");
    try {
      const res = await fetch(`/api/competitors/${competitorId}/generate-topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to generate topics");
        setGeneratingTopics(false);
        return;
      }

      const mappedTopics = result.topics.map((t: any) => ({
        topic: t.topic,
        mentions: t.mention_count || t.mentions || 0,
        sentiment: t.sentiment_score || t.sentiment || null
      }));

      setData((prevData) => prevData ? {
        ...prevData,
        competitor: { ...prevData.competitor, topTopics: mappedTopics }
      } : null);

      setTopicsGenerated(true);
      setGeneratingTopics(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate topics");
      setGeneratingTopics(false);
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
          onClick={() => setShowSyncModal(true)}
          disabled={syncing}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all duration-200"
        >
          {syncing ? "Syncing..." : "Sync More Reviews"}
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
              <p className="text-slate-400 text-sm mb-1">Total Rating</p>
              <div className="flex items-center gap-2 mb-1">
                <StarRating rating={data.yourBusiness.avgRating} size="lg" />
                <span className="text-2xl font-bold text-white">
                  {data.yourBusiness.avgRating.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Fetched: {data.yourBusiness.fetchedAvgRating ? `${data.yourBusiness.fetchedAvgRating.toFixed(1)} ★` : "N/A"}
              </p>
            </div>

            {/* Reviews */}
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Reviews</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-white">{data.yourBusiness.totalPlatformReviews || data.yourBusiness.totalReviews}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {data.yourBusiness.totalReviews} fetched & analyzed
              </p>
            </div>

            {/* Response Rate */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Response Rate</p>
                <p className="text-2xl font-bold text-emerald-400">{data.yourBusiness.responseRate}%</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1 flex items-center gap-1">
                  High Impact <span className="text-slate-500 cursor-pointer normal-case" title="Reviews from Local Guides, users with 50+ reviews, or reviews with 5+ likes. These reviews have a disproportionately large impact on search ranking and public perception.">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 hover:text-slate-300 transition-colors">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                  </span>
                </p>
                <p className="text-2xl font-bold text-amber-400">{data.yourBusiness.highImpactCount ?? 0}</p>
              </div>
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
              <p className="text-slate-400 text-sm mb-1">Total Rating</p>
              <div className="flex items-center gap-2 mb-1">
                <StarRating rating={data.competitor.avgRating || 0} size="lg" />
                <span className="text-2xl font-bold text-white">
                  {data.competitor.avgRating?.toFixed(1) || "N/A"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Fetched: {data.competitor.fetchedAvgRating ? `${data.competitor.fetchedAvgRating.toFixed(1)} ★` : "N/A"}
              </p>
            </div>

            {/* Reviews */}
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Reviews</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-white">{data.competitor.totalPlatformReviews || data.competitor.totalReviews || 0}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {data.competitor.totalReviews || 0} fetched & analyzed
              </p>
            </div>

            {/* Response Rate */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Response Rate</p>
                <p className="text-2xl font-bold text-slate-400">
                  {data.competitor.responseRate != null ? `${data.competitor.responseRate}%` : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1 flex items-center gap-1">
                  High Impact <span className="text-slate-500 cursor-pointer normal-case" title="Reviews from Local Guides, users with 50+ reviews, or reviews with 5+ likes. These reviews have a disproportionately large impact on search ranking and public perception.">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 hover:text-slate-300 transition-colors">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                  </span>
                </p>
                <p className="text-2xl font-bold text-amber-400">{data.competitor.highImpactCount ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment Breakdown */}
      {!sentimentGenerated ? (
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-2">📊 Sentiment Breakdown</h4>
              <p className="text-slate-400 text-sm">
                Analyze the emotional tone of reviews for both your business and competitors. See the distribution of positive, negative, and mixed sentiments to understand customer satisfaction levels.
              </p>
            </div>
            <button
              onClick={handleGenerateSentiment}
              disabled={generatingSentiment}
              className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap"
            >
              {generatingSentiment ? "Analyzing..." : "Analyze Sentiment"}
            </button>
          </div>
        </div>
      ) : (
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
      )}

      {/* Top Topics */}
      {!topicsGenerated ? (
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-2">🏷️ Top Topics Analysis</h4>
              <p className="text-slate-400 text-sm">
                Extract and analyze the most discussed topics in reviews. Understand what customers are talking about most, their sentiment for each topic, and identify trends and pain points.
              </p>
            </div>
            <button
              onClick={handleGenerateTopics}
              disabled={generatingTopics}
              className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap"
            >
              {generatingTopics ? "Extracting..." : "Extract Topics"}
            </button>
          </div>
        </div>
      ) : (
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
                <div key={idx} className="flex items-center gap-2 text-slate-300">
                  <span className="text-indigo-400">•</span>
                  <span>{topic.topic}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No topics extracted yet</p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Competitive Insights */}
      {data.insights.length > 0 && insightsGenerated ? (
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
      ) : !insightsGenerated ? (
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-2">🤖 AI-Powered Competitive Insights</h4>
              <p className="text-slate-400 text-sm">
                Get AI-generated insights comparing your business with competitors. Discover your competitive advantages, areas to improve, and actionable recommendations based on customer sentiment and review patterns.
              </p>
            </div>
            <button
              onClick={handleGenerateInsights}
              disabled={generatingInsights}
              className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap"
            >
              {generatingInsights ? "Generating..." : "Generate Insights"}
            </button>
          </div>
        </div>
      ) : null}

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

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-white mb-2">Sync More Reviews</h2>
            <p className="text-slate-400 text-sm mb-6">
              Select how many reviews to fetch (1–100).
            </p>

            <div className="space-y-4">
              {/* Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">Number of Reviews</label>
                  <span className="text-sm font-bold text-indigo-400">{syncCount}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={syncCount}
                  onChange={(e) => setSyncCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowSyncModal(false)}
                  disabled={syncing}
                  className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSync(syncCount)}
                  disabled={syncing}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  {syncing ? "Syncing..." : `Sync ${syncCount} Review${syncCount !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
