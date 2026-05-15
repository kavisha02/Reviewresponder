"use client";

import { useState } from "react";

interface CompetitorSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (competitorName: string, googleMapsUrl?: string, maxReviews?: number) => Promise<void>;
  isLoading?: boolean;
  tierLimit?: number;
  currentCount?: number;
}

export default function CompetitorSelectModal({
  isOpen,
  onClose,
  onAdd,
  isLoading = false,
  tierLimit = 3,
  currentCount = 0,
}: CompetitorSelectModalProps) {
  const [step, setStep] = useState<"details" | "reviews">("details");
  const [competitorName, setCompetitorName] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [maxReviews, setMaxReviews] = useState(50);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAddMore = currentCount < tierLimit;

  async function handleNext(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!competitorName.trim()) {
      setError("Competitor name is required");
      return;
    }

    if (!canAddMore) {
      setError(`You've reached the limit of ${tierLimit} competitors for your tier`);
      return;
    }

    setStep("reviews");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (maxReviews < 10 || maxReviews > 500) {
      setError("Please enter a number between 10 and 500");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(competitorName, googleMapsUrl || undefined, maxReviews);
      setCompetitorName("");
      setGoogleMapsUrl("");
      setMaxReviews(50);
      setStep("details");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add competitor");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBack() {
    setStep("details");
    setError("");
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-lg font-bold text-white mb-2">
          {step === "details" ? "Add Competitor" : "Select Review Count"}
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          {step === "details"
            ? "Enter competitor details to start tracking their reputation."
            : "How many reviews should we fetch for comparison?"}
        </p>

        {!canAddMore && (
          <div className="bg-yellow-950/50 border border-yellow-700/50 rounded-lg px-4 py-3 mb-4 text-yellow-300 text-sm">
            You've reached the limit of {tierLimit} competitors for your tier. Upgrade to Pro for unlimited competitors.
          </div>
        )}

        {step === "details" ? (
          <form onSubmit={handleNext} className="space-y-4">
            {/* Competitor Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                Competitor Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={competitorName}
                onChange={(e) => setCompetitorName(e.target.value)}
                placeholder="e.g. Competitor Salon"
                disabled={isSubmitting || !canAddMore}
                className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 disabled:opacity-50"
              />
              <p className="text-xs text-slate-500 mt-1">This name cannot be changed later</p>
            </div>

            {/* Google Maps URL */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-slate-300 mb-1.5">
                Google Maps URL <span className="text-slate-500">(optional)</span>
              </label>
              <input
                id="url"
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://www.google.com/maps/place/..."
                disabled={isSubmitting || !canAddMore}
                className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 disabled:opacity-50"
              />
              <p className="text-xs text-slate-500 mt-1">You can edit this URL later if needed</p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !canAddMore}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              >
                Next →
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Review Count */}
            <div>
              <label htmlFor="reviews" className="block text-sm font-medium text-slate-300 mb-1.5">
                Number of Reviews <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="reviews"
                  type="number"
                  min="10"
                  max="500"
                  value={maxReviews}
                  onChange={(e) => setMaxReviews(parseInt(e.target.value) || 50)}
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 disabled:opacity-50"
                />
                <span className="text-slate-400 text-sm">reviews</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Between 10 and 500 reviews (default: 50)</p>
            </div>

            {/* Info */}
            <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-lg px-4 py-3 text-indigo-300 text-sm">
              <p className="font-medium mb-1">💡 Tip:</p>
              <p>More reviews = better analysis but longer fetch time. Start with 50 for quick results.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              >
                {isSubmitting ? "Adding..." : "Add Competitor"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
