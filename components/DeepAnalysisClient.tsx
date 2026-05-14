"use client";

import { useState, useEffect } from "react";
import { Business, Review } from "@/lib/types";
import { getCachedAnalysis, saveCachedAnalysis, isAnalysisCacheStale, type AnalysisType } from "@/lib/supabase/analytics-cache";

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
  const [categoryAnalysis, setCategoryAnalysis] = useState<{
    topics: Topic[];
    insights: Insight[];
    summary: string;
  } | null>(null);
  const [sentimentAnalysis, setSentimentAnalysis] = useState<{
    positive: string;
    negative: string;
    mixed: string;
  } | null>(null);
  const [actionableInsights, setActionableInsights] = useState<Insight[] | null>(null);
  const [locationSummary, setLocationSummary] = useState<string | null>(null);

  const [loadingCategory, setLoadingCategory] = useState(false);
  const [loadingSentiment, setLoadingSentiment] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [error, setError] = useState("");

  // Load cached analysis from Supabase on mount
  useEffect(() => {
    async function loadCachedAnalysis() {
      const [categoryCache, sentimentCache, insightsCache, summaryCache] = await Promise.all([
        getCachedAnalysis(businessId, "category"),
        getCachedAnalysis(businessId, "sentiment"),
        getCachedAnalysis(businessId, "insights"),
        getCachedAnalysis(businessId, "summary"),
      ]);

      if (categoryCache && !isAnalysisCacheStale(categoryCache, reviews.length)) {
        setCategoryAnalysis(categoryCache.results as typeof categoryAnalysis);
      }
      if (sentimentCache && !isAnalysisCacheStale(sentimentCache, reviews.length)) {
        setSentimentAnalysis(sentimentCache.results as typeof sentimentAnalysis);
      }
      if (insightsCache && !isAnalysisCacheStale(insightsCache, reviews.length)) {
        setActionableInsights(insightsCache.results as typeof actionableInsights);
      }
      if (summaryCache && !isAnalysisCacheStale(summaryCache, reviews.length)) {
        setLocationSummary(summaryCache.results as string);
      }
    }

    loadCachedAnalysis();
  }, [businessId, reviews.length]);

  // Calculate statistics
  const totalReviews = reviews.length;
  const avgRatingNum = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;
  const avgRating = avgRatingNum.toFixed(1);

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

  // Fetch category analysis
  async function handleCategoryAnalysis() {
    // Check if analysis is fresh (no new reviews)
    if (categoryAnalysis) {
      setError("Analysis is up to date. No new reviews to analyze.");
      return;
    }

    const textReviewsCount = reviews.filter(r => r.review_text && r.review_text.trim().length > 0).length;
    if (textReviewsCount === 0) {
      setError("No reviews with text available to do analysis.");
      return;
    }

    setLoadingCategory(true);
    setError("");
    try {
      const res = await fetch("/api/analytics/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Failed to analyze categories");
        setLoadingCategory(false);
        return;
      }

      setCategoryAnalysis(result);
      await saveCachedAnalysis(businessId, "category", result, reviews.length);
      setLoadingCategory(false);
    } catch (err) {
      setError("An error occurred while analyzing categories");
      setLoadingCategory(false);
    }
  }

  // Fetch sentiment analysis
  async function handleSentimentAnalysis() {
    // Check if analysis is fresh (no new reviews)
    if (sentimentAnalysis) {
      setError("Analysis is up to date. No new reviews to analyze.");
      return;
    }

    const textReviewsCount = reviews.filter(r => r.review_text && r.review_text.trim().length > 0).length;
    if (textReviewsCount === 0) {
      setError("No reviews with text available to do analysis.");
      return;
    }

    setLoadingSentiment(true);
    setError("");
    try {
      const res = await fetch("/api/analytics/sentiment-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Failed to analyze sentiment");
        setLoadingSentiment(false);
        return;
      }

      setSentimentAnalysis(result);
      await saveCachedAnalysis(businessId, "sentiment", result, reviews.length);
      setLoadingSentiment(false);
    } catch (err) {
      setError("An error occurred while analyzing sentiment");
      setLoadingSentiment(false);
    }
  }

  // Fetch actionable insights
  async function handleActionableInsights() {
    // Check if analysis is fresh (no new reviews)
    if (actionableInsights) {
      setError("Analysis is up to date. No new reviews to analyze.");
      return;
    }

    const textReviewsCount = reviews.filter(r => r.review_text && r.review_text.trim().length > 0).length;
    if (textReviewsCount === 0) {
      setError("No reviews with text available to do analysis.");
      return;
    }

    setLoadingInsights(true);
    setError("");
    try {
      const res = await fetch("/api/analytics/actionable-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Failed to generate insights");
        setLoadingInsights(false);
        return;
      }

      setActionableInsights(result.insights);
      await saveCachedAnalysis(businessId, "insights", result.insights, reviews.length);
      setLoadingInsights(false);
    } catch (err) {
      setError("An error occurred while generating insights");
      setLoadingInsights(false);
    }
  }

  // Fetch location summary
  async function handleLocationSummary() {
    // Check if analysis is fresh (no new reviews)
    if (locationSummary) {
      setError("Analysis is up to date. No new reviews to analyze.");
      return;
    }

    const textReviewsCount = reviews.filter(r => r.review_text && r.review_text.trim().length > 0).length;
    if (textReviewsCount === 0) {
      setError("No reviews with text available to do analysis.");
      return;
    }

    setLoadingSummary(true);
    setError("");
    try {
      const res = await fetch("/api/analytics/location-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Failed to generate summary");
        setLoadingSummary(false);
        return;
      }

      setLocationSummary(result.summary);
      await saveCachedAnalysis(businessId, "summary", result.summary, reviews.length);
      setLoadingSummary(false);
    } catch (err) {
      setError("An error occurred while generating summary");
      setLoadingSummary(false);
    }
  }


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
                  {avgRatingNum >= 4.5 ? "Excellent" : avgRatingNum >= 4 ? "Highly Positive" : avgRatingNum >= 3 ? "Mixed" : "Needs Improvement"}
                </p>
              </div>
              {locationSummary && (
                <div>
                  <p className="text-slate-400 text-sm mb-1">AI Summary</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{locationSummary}</p>
                </div>
              )}
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
                  {totalReviews > 0 ? Math.round((reviews.filter(r => r.status === "published").length / totalReviews) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Summary Button */}
        {!locationSummary && (
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-2">📝 AI-Powered Location Summary</h4>
                <p className="text-slate-400 text-sm">
                  Get a concise AI-generated summary of your business based on customer reviews. Understand what customers think about your services, strengths, and areas for improvement in one comprehensive overview.
                </p>
              </div>
              <button
                onClick={handleLocationSummary}
                disabled={loadingSummary}
                className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap"
              >
                {loadingSummary ? "Generating..." : "Generate Summary"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── 2. CATEGORY-BASED ANALYSIS ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-3xl">🏷️</span> Category-Based Analysis
        </h2>

        {!categoryAnalysis ? (
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-2">🤖 Deep AI Category Analysis</h4>
                <p className="text-slate-400 text-sm">
                  Leverage AI to automatically extract and categorize key topics from all reviews. Discover what customers are talking about most, their sentiment for each topic, and real examples from reviews. Perfect for identifying trends and customer pain points.
                </p>
              </div>
              <button
                onClick={handleCategoryAnalysis}
                disabled={loadingCategory}
                className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap"
              >
                {loadingCategory ? "Analyzing..." : "Analyze Categories"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryAnalysis.topics.map((topic, idx) => (
              <div
                key={idx}
                className={`border rounded-xl p-5 ${sentimentBgColors[topic.sentiment]} backdrop-blur-sm hover:border-opacity-100 transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-white font-semibold text-base">{topic.topic}</h4>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium bg-gradient-to-r ${sentimentColors[topic.sentiment]
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
        )}
      </section>

      {/* ── 3. SENTIMENT BREAKDOWN ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-3xl">📊</span> Sentiment Breakdown
        </h2>

        {!sentimentAnalysis ? (
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-2">💭 Sentiment Analysis</h4>
                <p className="text-slate-400 text-sm">
                  Get detailed AI insights into the emotional tone of your reviews. Understand the distribution of positive, negative, and mixed sentiments, and receive actionable recommendations for addressing customer concerns.
                </p>
              </div>
              <button
                onClick={handleSentimentAnalysis}
                disabled={loadingSentiment}
                className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap"
              >
                {loadingSentiment ? "Analyzing..." : "Analyze Sentiment"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sentiment Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Positive */}
              {/* <div className="bg-gradient-to-br from-emerald-950/40 to-emerald-900/20 border border-emerald-800/40 rounded-xl p-6 backdrop-blur-sm">
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
              </div> */}

              {/* Negative */}
              {/* <div className="bg-gradient-to-br from-red-950/40 to-red-900/20 border border-red-800/40 rounded-xl p-6 backdrop-blur-sm">
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
              </div> */}

              {/* Mixed */}
              {/* <div className="bg-gradient-to-br from-yellow-950/40 to-yellow-900/20 border border-yellow-800/40 rounded-xl p-6 backdrop-blur-sm">
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
              </div> */}
            </div>

            {/* Distribution Chart */}
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

            {/* Sentiment Insights */}
            {sentimentAnalysis && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4">
                  <p className="text-emerald-300 text-xs font-semibold mb-2">POSITIVE INSIGHT</p>
                  <p className="text-slate-300 text-sm">{sentimentAnalysis.positive}</p>
                </div>
                <div className="bg-yellow-950/30 border border-yellow-800/40 rounded-xl p-4">
                  <p className="text-yellow-300 text-xs font-semibold mb-2">MIXED INSIGHT</p>
                  <p className="text-slate-300 text-sm">{sentimentAnalysis.mixed}</p>
                </div>
                <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4">
                  <p className="text-red-300 text-xs font-semibold mb-2">NEGATIVE INSIGHT</p>
                  <p className="text-slate-300 text-sm">{sentimentAnalysis.negative}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── 4. ACTIONABLE INSIGHTS ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-3xl">💡</span> Actionable Insights
        </h2>

        {!actionableInsights ? (
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-2">🎯 AI-Powered Problem Solving</h4>
                <p className="text-slate-400 text-sm">
                  Get AI-generated recommendations to solve real customer problems. Each insight identifies a specific issue, explains its impact on your business, and provides a concrete action you can take immediately to improve customer satisfaction and ratings.
                </p>
              </div>
              <button
                onClick={handleActionableInsights}
                disabled={loadingInsights}
                className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap"
              >
                {loadingInsights ? "Generating..." : "Generate Insights"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actionableInsights.map((insight, idx) => (
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
        )}
      </section>

      {/* ── 5. FEATURED TOP POSITIVE REVIEWS ── */}
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
                    <p className="text-slate-500 text-xs" suppressHydrationWarning>
                      {review.review_date ? new Date(review.review_date).toLocaleDateString() : "Unknown date"}
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

      {/* ── Error Display ── */}
      {error && (
        <div className="bg-red-950/50 border border-red-700/50 rounded-xl p-6 text-red-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
