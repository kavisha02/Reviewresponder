/**
 * SyncReviewsButton — client component to sync real reviews from Google Places API.
 *
 * Shows a button that opens a modal to enter Google Place ID,
 * then fetches and syncs real reviews from Google Places 
 */

"use client";

import { useState } from "react";

interface Props {
  businessId: string;
}

export default function SyncReviewsButton({ businessId }: Props) {
  const [open, setOpen]           = useState(false);
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState("");
  const [syncCount, setSyncCount] = useState(0);

  async function handleSync() {
    if (!googlePlaceId.trim()) {
      setError("Please enter a Google Place ID");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/reviews/sync-from-google-places", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ businessId, googlePlaceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to sync reviews");
        setLoading(false);
        return;
      }

      setSyncCount(data.count);
      setSuccess(true);
      setGooglePlaceId("");
      setLoading(false);

      // Close modal after 3 seconds
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        // Refresh page to show new reviews
        window.location.reload();
      }, 3000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2.5 py-1.5 rounded-lg transition-all duration-200 bg-slate-800/40 hover:bg-slate-800"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Sync Real Reviews
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-white mb-4">Sync Reviews from Google</h2>

            {success ? (
              <div className="bg-emerald-950/50 border border-emerald-700/50 rounded-lg px-4 py-3 text-emerald-300 text-sm">
                ✓ Successfully synced {syncCount} review{syncCount !== 1 ? "s" : ""}! Refreshing...
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Google Place ID
                  </label>
                  <input
                    type="text"
                    value={googlePlaceId}
                    onChange={(e) => setGooglePlaceId(e.target.value)}
                    placeholder="e.g. ChIJN1blFLsB3ogAeUBAIQK8J0s"
                    className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Find your Google Place ID by searching your business on Google Maps. The ID is in the URL or use the search tool.
                  </p>
                </div>

                <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-lg px-3 py-2 mb-4 text-indigo-300 text-xs">
                  <strong>Google Places API:</strong> Syncs reviews from your Google Business Profile
                </div>

                {error && (
                  <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-3 py-2 text-red-300 text-xs mb-4">
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSync}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    {loading ? "Syncing…" : "Sync Reviews"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

