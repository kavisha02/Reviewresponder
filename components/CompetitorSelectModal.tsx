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
  const [step, setStep] = useState<"details" | "preview" | "reviews">("details");
  const [competitorName, setCompetitorName] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [maxReviews, setMaxReviews] = useState(1);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAddMore = true;

  async function handleNext(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!competitorName.trim()) {
      setError("Competitor name is required");
      return;
    }

    if (!googleMapsUrl.trim()) {
      setError("Google Maps URL is required to fetch reviews");
      return;
    }

    setStep("preview");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (maxReviews < 1 || maxReviews > 100) {
      setError("Please select a number between 1 and 100");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(competitorName, googleMapsUrl || undefined, maxReviews);
      setCompetitorName("");
      setGoogleMapsUrl("");
      setMaxReviews(1);
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

  function handlePreviewNext() {
    setStep("reviews");
    setError("");
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-lg font-bold text-white mb-2">
          {step === "details" ? "Add Competitor" : step === "preview" ? "Review Details" : "Select Review Count"}
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          {step === "details"
            ? "Enter competitor details to start tracking their reputation."
            : step === "preview"
            ? "Review the competitor details. You can edit the URL if needed."
            : "How many reviews should we fetch for comparison?"}
        </p>

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
                Google Maps URL <span className="text-red-400">*</span>
              </label>
              <input
                id="url"
                type="url"
                required
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://www.google.com/maps/place/..."
                disabled={isSubmitting || !canAddMore}
                className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 disabled:opacity-50"
              />
              <p className="text-xs text-slate-500 mt-1">Required to fetch competitor reviews</p>
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
        ) : step === "preview" ? (
          <form onSubmit={(e) => { e.preventDefault(); handlePreviewNext(); }} className="space-y-4">
            {/* Competitor Name Display */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Competitor Name
              </label>
              <div className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm">
                {competitorName}
              </div>
              <p className="text-xs text-slate-500 mt-1">Cannot be changed</p>
            </div>

            {/* Google Maps URL - Editable */}
            <div>
              <label htmlFor="preview-url" className="block text-sm font-medium text-slate-300 mb-1.5">
                Google Maps URL
              </label>
              <input
                id="preview-url"
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200"
              />
              <p className="text-xs text-slate-500 mt-1">You can edit this URL if needed</p>
            </div>

            {/* Info Box */}
            <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-lg px-4 py-3 text-indigo-300 text-sm">
              <p className="font-medium mb-1">✓ Details Confirmed</p>
              <p>Ready to proceed to review count selection.</p>
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
                onClick={() => setStep("details")}
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
                Next →
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Number of Reviews</label>
                <span className="text-sm font-bold text-indigo-400">{maxReviews}</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={maxReviews}
                onChange={(e) => setMaxReviews(parseInt(e.target.value))}
                disabled={isSubmitting}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1</span>
                <span>100</span>
              </div>
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
                onClick={() => setStep("preview")}
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
                {isSubmitting ? "Adding..." : `Add with ${maxReviews} Review${maxReviews !== 1 ? "s" : ""}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
