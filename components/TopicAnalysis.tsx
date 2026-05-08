/**
 * TopicAnalysis — client component to display LLM topic analysis.
 *
 * Shows:
 * - Main topics with sentiment
 * - Actionable insights
 * - Overall summary
 *
 * Caches results in localStorage to avoid re-analyzing on every page load.
 * Only re-analyzes when the review count changes.
 */

"use client";

import { useState, useEffect } from "react";

interface Topic {
  topic: string;
  sentiment: "positive" | "negative" | "neutral";
  mentions: number;
  examples: string[];
}

interface Insight {
  insight: string;
  impact: string;
  recommendation: string;
}

interface Props {
  businessId: string;
}

export default function TopicAnalysis({ businessId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<{
    topics: Topic[];
    insights: Insight[];
    summary: string;
    reviewsAnalyzed: number;
  } | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      const cacheKey = `topic-analysis-${businessId}`;
      const cached = localStorage.getItem(cacheKey);

      // First, fetch the current review count to check if we need to re-analyze
      try {
        const countRes = await fetch(`/api/analytics/review-count?businessId=${businessId}`);
        const countData = await countRes.json();
        const currentReviewCount = countData.count || 0;

        // Check if we have cached data and if the review count hasn't changed
        if (cached) {
          const cachedData = JSON.parse(cached);
          if (cachedData.reviewsAnalyzed === currentReviewCount) {
            // Use cached data
            setData(cachedData);
            setLoading(false);
            return;
          }
        }

        // Reviews changed or no cache, fetch fresh analysis
        const res = await fetch("/api/analytics/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId }),
        });

        const result = await res.json();

        if (!res.ok) {
          setError(result.error ?? "Failed to analyze topics");
          setLoading(false);
          return;
        }

        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify(result));
        setData(result);
        setLoading(false);
      } catch (err) {
        setError("An error occurred while analyzing topics");
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, [businessId]);

  if (loading) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 text-center">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-3" />
        <p className="text-slate-400 text-sm">Analyzing topics with AI...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/50 border border-red-700/50 rounded-xl p-6 text-red-300 text-sm">
        {error}
      </div>
    );
  }

  if (!data || data.topics.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 text-center text-slate-400 text-sm">
        No reviews to analyze yet
      </div>
    );
  }

  const sentimentColors = {
    positive: "from-emerald-500 to-green-600",
    negative: "from-red-500 to-rose-600",
    neutral: "from-yellow-500 to-orange-500",
  };

  const sentimentBgColors = {
    positive: "bg-emerald-950/40 border-emerald-800/40",
    negative: "bg-red-950/40 border-red-800/40",
    neutral: "bg-yellow-950/40 border-yellow-800/40",
  };

  const sentimentTextColors = {
    positive: "text-emerald-300",
    negative: "text-red-300",
    neutral: "text-yellow-300",
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-indigo-300 mb-2">Summary</h3>
        <p className="text-slate-300 text-sm leading-relaxed">{data.summary}</p>
        <p className="text-slate-500 text-xs mt-3">
          Based on analysis of {data.reviewsAnalyzed} review
          {data.reviewsAnalyzed !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Topics */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
          Key Topics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.topics.map((topic, idx) => (
            <div
              key={idx}
              className={`border rounded-xl p-4 ${sentimentBgColors[topic.sentiment]}`}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-white font-semibold text-sm">{topic.topic}</h4>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium bg-gradient-to-r ${
                    sentimentColors[topic.sentiment]
                  } text-white`}
                >
                  {topic.sentiment.charAt(0).toUpperCase() + topic.sentiment.slice(1)}
                </span>
              </div>

              <div className="mb-3">
                <p className={`text-xs font-semibold ${sentimentTextColors[topic.sentiment]} mb-2`}>
                  Mentioned {topic.mentions} times
                </p>
                <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${sentimentColors[topic.sentiment]}`}
                    style={{ width: `${Math.min((topic.mentions / 50) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-slate-500 text-xs font-medium">Examples:</p>
                {topic.examples.map((example, i) => (
                  <p key={i} className="text-slate-400 text-xs italic">
                    "{example}"
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
          Actionable Insights
        </h3>
        <div className="space-y-3">
          {data.insights.map((insight, idx) => (
            <div key={idx} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <div className="flex gap-3">
                <div className="text-2xl flex-shrink-0">💡</div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-sm mb-1">
                    {insight.insight}
                  </h4>
                  <p className="text-slate-400 text-xs mb-2">
                    <strong>Impact:</strong> {insight.impact}
                  </p>
                  <p className="text-indigo-300 text-xs">
                    <strong>Recommendation:</strong> {insight.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

  if (loading) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 text-center">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-3" />
        <p className="text-slate-400 text-sm">Analyzing topics with AI...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/50 border border-red-700/50 rounded-xl p-6 text-red-300 text-sm">
        {error}
      </div>
    );
  }

  if (!data || data.topics.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 text-center text-slate-400 text-sm">
        No reviews to analyze yet
      </div>
    );
  }

  const sentimentColors = {
    positive: "from-emerald-500 to-green-600",
    negative: "from-red-500 to-rose-600",
    neutral: "from-yellow-500 to-orange-500",
  };

  const sentimentBgColors = {
    positive: "bg-emerald-950/40 border-emerald-800/40",
    negative: "bg-red-950/40 border-red-800/40",
    neutral: "bg-yellow-950/40 border-yellow-800/40",
  };

  const sentimentTextColors = {
    positive: "text-emerald-300",
    negative: "text-red-300",
    neutral: "text-yellow-300",
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-indigo-300 mb-2">Summary</h3>
        <p className="text-slate-300 text-sm leading-relaxed">{data.summary}</p>
        <p className="text-slate-500 text-xs mt-3">
          Based on analysis of {data.reviewsAnalyzed} review
          {data.reviewsAnalyzed !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Topics */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
          Key Topics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.topics.map((topic, idx) => (
            <div
              key={idx}
              className={`border rounded-xl p-4 ${sentimentBgColors[topic.sentiment]}`}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-white font-semibold text-sm">{topic.topic}</h4>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium bg-gradient-to-r ${
                    sentimentColors[topic.sentiment]
                  } text-white`}
                >
                  {topic.sentiment.charAt(0).toUpperCase() + topic.sentiment.slice(1)}
                </span>
              </div>

              <div className="mb-3">
                <p className={`text-xs font-semibold ${sentimentTextColors[topic.sentiment]} mb-2`}>
                  Mentioned {topic.mentions} times
                </p>
                <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${sentimentColors[topic.sentiment]}`}
                    style={{ width: `${Math.min((topic.mentions / 50) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-slate-500 text-xs font-medium">Examples:</p>
                {topic.examples.map((example, i) => (
                  <p key={i} className="text-slate-400 text-xs italic">
                    "{example}"
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
          Actionable Insights
        </h3>
        <div className="space-y-3">
          {data.insights.map((insight, idx) => (
            <div key={idx} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <div className="flex gap-3">
                <div className="text-2xl flex-shrink-0">💡</div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-sm mb-1">
                    {insight.insight}
                  </h4>
                  <p className="text-slate-400 text-xs mb-2">
                    <strong>Impact:</strong> {insight.impact}
                  </p>
                  <p className="text-indigo-300 text-xs">
                    <strong>Recommendation:</strong> {insight.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
