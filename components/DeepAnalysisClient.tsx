"use client";

import { useState, useEffect } from "react";
import { Business, Review } from "@/lib/types";

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
  reviews: Review[];
  business: Business;
}

export default function DeepAnalysisClient({ businessId, reviews, business }: Props) {
  const [topicAnalysis, setTopicAnalysis] = useState<{
    topics: Topic[];
    insights: Insight[];
    summary: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalysis() {
      try {
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

        setTopicAnalysis(result);
        setLoading(false);
      } catch (err) {
        setError("An error occurred while analyzing topics");
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, [businessId]);

  // Calculate statistics
  const totalReviews = reviews.length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : 0;

  const positiveReviews = reviews.filter(r => r.rating >= 4);
  const negativeReviews = reviews.filter(r => r.rating <= 2);
  const mixedReviews = reviews.filter(r => r.rating === 3);

  const topPositiveReviews = positiveReviews
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3);

  // Sentiment colors
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
    <div className="space-y-8">
      {/* ── 1. LOCATION OVERVIEW ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-3xl">📍</span> Location Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overview Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4">{business.name}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-sm mb-1">Business Type</p>
                <p className="text-white font-medium">{business.business_type || "Not specified"}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Customer Sentiment</p>
                <p className="text-white font-medium">
                  {avgRating >= 4 ? "Highly Positive" : avgRating >= 3 ? "Mixed" : "Needs Improvement"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Summary</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {topicAnalysis?.summary || "Analyzing reviews..."}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-br from-indigo-950/40 to-indigo-900/20 border border-indigo-800/40 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-indigo-300 mb-4 uppercase tracking-wide">Quick Stats</h3>
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-xs">Total Reviews</p>
                <p className="text-2xl font-bold text-white">{totalReviews}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Average Rating</p>
                <p className="text-2xl font-bold text-yellow-400">{avgRating}★</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Response Rate</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {totalReviews > 0 ? Math.round((reviews.filter(r => r.status === "draft").length / totalReviews) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. CATEGORY-BASED ANALYSIS ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-3xl">🏷️</span> Category-Based Analysis
        </h2>

        {loading ? (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-8 text-center">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-3" />
            <p className="text-slate-400 text-sm">Analyzing categories...</p>
          </div>
        ) : error ? (
          <div className="bg-red-950/50 border border-red-700/50 rounded-xl p-6 text-red-300 text-sm">
            {error}
          </div>
        ) : topicAnalysis?.topics && topicAnalysis.topics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topicAnalysis.topics.map((topic, idx) => (
              <div
                key={idx}
                className={`border rounded-xl p-5 ${sentimentBgColors[topic.sentiment]} backdrop-blur-sm hover:border-opacity-100 transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-white font-semibold text-base">{topic.topic}</h4>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium bg-gradient-to-r ${
                      sentimentColors[topic.sentiment]
                    } text-white`}
                  >
                    {topic.sentiment.charAt(0).toUpperCase() + topic.sentiment.slice(1)}
                  </span>
                </div>

                <div className="mb-4">
                  <p className={`text-xs font-semibold ${sentimentTextColors[topic.sentiment]} mb-2`}>
                    Mentioned {topic.mentions} times
                  </p>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${sentimentColors[topic.sentiment]}`}
                      style={{ width: `${Math.min((topic.mentions / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 text-xs font-medium mb-2">Examples:</p>
                  <p className="text-slate-300 text-sm">
                    {topic.examples.join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 text-center text-slate-400 text-sm">
            No categories to analyze yet
          </div>
        )}
      </section>

      {/* ── 3. SENTIMENT BREAKDOWN ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-3xl">📊</span> Sentiment Breakdown
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Positive */}
          <div className="bg-gradient-to-br from-emerald-950/40 to-emerald-900/20 border border-emerald-800/40 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-emerald-300">Positive</h3>
              <span className="text-3xl">😊</span>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-emerald-400">{positiveReviews.length}</p>
              <p className="text-slate-400 text-sm">
                {totalReviews > 0 ? Math.round((positiveReviews.length / totalReviews) * 100) : 0}% of reviews
              </p>
              <div className="w-full bg-slate-700/50 rounded-full h-2 mt-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-600"
                  style={{ width: `${totalReviews > 0 ? (positiveReviews.length / totalReviews) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Negative */}
          <div className="bg-gradient-to-br from-red-950/40 to-red-900/20 border border-red-800/40 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-300">Negative</h3>
              <span className="text-3xl">😞</span>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-red-400">{negativeReviews.length}</p>
              <p className="text-slate-400 text-sm">
                {totalReviews > 0 ? Math.round((negativeReviews.length / totalReviews) * 100) : 0}% of reviews
              </p>
              <div className="w-full bg-slate-700/50 rounded-full h-2 mt-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-600"
                  style={{ width: `${totalReviews > 0 ? (negativeReviews.length / totalReviews) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Mixed */}
          <div className="bg-gradient-to-br from-yellow-950/40 to-yellow-900/20 border border-yellow-800/40 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-yellow-300">Mixed</h3>
              <span className="text-3xl">😐</span>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-yellow-400">{mixedReviews.length}</p>
              <p className="text-slate-400 text-sm">
                {totalReviews > 0 ? Math.round((mixedReviews.length / totalReviews) * 100) : 0}% of reviews
              </p>
              <div className="w-full bg-slate-700/50 rounded-full h-2 mt-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-600"
                  style={{ width: `${totalReviews > 0 ? (mixedReviews.length / totalReviews) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sentiment Chart */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-slate-300 mb-6 uppercase tracking-wide">Distribution</h3>
          <div className="space-y-4">
            {[
              { label: "Positive (4-5★)", count: positiveReviews.length, color: "from-emerald-500 to-green-600" },
              { label: "Mixed (3★)", count: mixedReviews.length, color: "from-yellow-500 to-orange-600" },
              { label: "Negative (1-2★)", count: negativeReviews.length, color: "from-red-500 to-rose-600" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 text-sm font-medium">{item.label}</span>
                  <span className="text-slate-400 text-sm">{item.count} reviews</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-3">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                    style={{ width: `${totalReviews > 0 ? (item.count / totalReviews) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. FEATURED TOP POSITIVE REVIEWS ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-3xl">⭐</span> Featured Top Reviews
        </h2>

        {topPositiveReviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {topPositiveReviews.map((review, idx) => (
              <div
                key={review.id}
                className="bg-gradient-to-br from-emerald-950/30 to-slate-800/30 border border-emerald-800/40 rounded-xl p-6 backdrop-blur-sm hover:border-emerald-700/60 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-400 text-lg">
                        {"★".repeat(review.rating || 5)}
                      </span>
                      <span className="text-slate-500 text-sm">({review.rating}★)</span>
                    </div>
                    <p className="text-slate-300 font-medium">{review.author_name}</p>
                    <p className="text-slate-500 text-xs">
                      {new Date(review.review_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-3xl">#{idx + 1}</span>
                </div>

                <p className="text-slate-200 leading-relaxed mb-4">
                  "{review.review_text}"
                </p>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-700/50">
                  <span className="text-emerald-400 text-sm font-medium">✓ Verified Review</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 text-center text-slate-400 text-sm">
            No positive reviews yet
          </div>
        )}
      </section>

      {/* ── 5. ACTIONABLE INSIGHTS ── */}
      {topicAnalysis?.insights && topicAnalysis.insights.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">💡</span> Actionable Insights
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topicAnalysis.insights.map((insight, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-indigo-950/40 to-slate-800/40 border border-indigo-800/40 rounded-xl p-5 backdrop-blur-sm"
              >
                <h4 className="text-white font-semibold mb-2">{insight.insight}</h4>
                <p className="text-slate-400 text-sm mb-3">
                  <strong>Impact:</strong> {insight.impact}
                </p>
                <p className="text-indigo-300 text-sm">
                  <strong>Action:</strong> {insight.recommendation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
