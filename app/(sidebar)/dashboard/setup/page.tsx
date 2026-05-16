/**
 * Business Setup Page — /dashboard/setup
 *
 * Handles two cases:
 *   1. First time — user has no locations yet (redirected here from dashboard)
 *   2. Adding more — user already has locations and wants to add another
 *
 * After creating a location, redirects to /dashboard?business=<newId>
 * so the user lands directly on the newly added location.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const BUSINESS_TYPES = [
  "Restaurant / Café",
  "Salon / Spa",
  "Medical / Dental Clinic",
  "Auto Services",
  "Retail Shop",
  "Hotel / Accommodation",
  "Gym / Fitness",
  "Real Estate",
  "Legal / Financial Services",
  "Other",
];

export default function SetupPage() {
  const router = useRouter();

  const [name, setName]                   = useState("");
  const [businessType, setBusinessType]   = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [urlValidating, setUrlValidating] = useState(false);
  const [urlValid, setUrlValid]           = useState(false);
  const [urlValidationMsg, setUrlValidationMsg] = useState("");
  // Whether this user already has at least one location
  const [hasExisting, setHasExisting]     = useState(false);
  const [checkingExisting, setChecking]   = useState(true);
  const [step, setStep]                   = useState<"details" | "preview">("details");

  // Check if user already has locations — changes the page copy
  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      setHasExisting((count ?? 0) > 0);
      setChecking(false);
    }
    check();
  }, []);

  // Validate Google Maps URL
  async function validateGoogleMapsUrl() {
    if (!googleMapsUrl.trim()) {
      setUrlValidationMsg("Please enter a URL");
      setUrlValid(false);
      return;
    }

    setUrlValidating(true);
    setUrlValidationMsg("");

    try {
      const res = await fetch("/api/validate-google-maps-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: googleMapsUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setUrlValidationMsg(data.error || "Invalid Google Maps URL");
        setUrlValid(false);
        setUrlValidating(false);
        return;
      }

      setUrlValidationMsg(`✓ Location verified: ${data.businessName}`);
      setUrlValid(true);
      setUrlValidating(false);
    } catch (err) {
      setUrlValidationMsg("Failed to validate URL. Please try again.");
      setUrlValid(false);
      setUrlValidating(false);
    }
  }

  async function handleNext(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Business name is required");
      return;
    }

    setStep("preview");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/business/create", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, businessType, googleMapsUrl }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // Redirect to home page
    router.push("/home");
    router.refresh();
  }

  if (checkingExisting) return null; // brief loading before showing page

  return (
    <main className="h-full flex items-center justify-center px-4 py-8">
      <div className="orb orb-1 opacity-10" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                RR
              </div>
              <span className="font-semibold text-lg text-white">ReviewResponder</span>
            </div>
          </div>

          {/* Step indicator — only for first-time setup */}
          {!hasExisting && (
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</span>
                Account
              </div>
              <div className="flex-1 h-px bg-slate-700" />
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">2</span>
                Your Business
              </div>
              <div className="flex-1 h-px bg-slate-700" />
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-xs">3</span>
                Dashboard
              </div>
            </div>
          )}

          {/* Page title changes based on context */}
          <h1 className="text-2xl font-bold text-white mb-1">
            {step === "details"
              ? (hasExisting ? "Add a New Location" : "Tell us about your business")
              : "Review Your Details"
            }
          </h1>
          <p className="text-slate-400 text-sm mb-8">
            {step === "details"
              ? (hasExisting
                  ? "Each location gets its own review dashboard, stats, and AI responses."
                  : "This helps the AI write responses that match your business context and tone."
                )
              : "Review your information. You can edit the URL if needed."}
          </p>

          {step === "details" ? (
            <form onSubmit={handleNext} className="space-y-5">

              {/* Business name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                  {hasExisting ? "Location name" : "Business name"} <span className="text-red-400">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={hasExisting ? "e.g. The Salon – Bandra Branch" : "e.g. The Grand Salon, Dr. Patel's Clinic"}
                  className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200"
                />
              </div>

              {/* Business type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Business type
                </label>
                <select
                  id="type"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-sm outline-none transition-all duration-200 text-white"
                >
                  <option value="">Select a type (optional)</option>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Google Maps URL */}
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Google Maps Business URL <span className="text-slate-500">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="url"
                    type="url"
                    value={googleMapsUrl}
                    onChange={(e) => {
                      setGoogleMapsUrl(e.target.value);
                      setUrlValid(false);
                      setUrlValidationMsg("");
                    }}
                    placeholder="https://www.google.com/maps/place/..."
                    className={`flex-1 bg-slate-900 border rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 ${
                      urlValid
                        ? "border-emerald-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        : "border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    }`}
                  />
                  {googleMapsUrl.trim() && !urlValid && (
                    <button
                      type="button"
                      onClick={validateGoogleMapsUrl}
                      disabled={urlValidating}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap"
                    >
                      {urlValidating ? "Verifying..." : "Verify"}
                    </button>
                  )}
                </div>

                {/* Validation message */}
                {urlValidationMsg && (
                  <p className={`text-xs mt-2 ${
                    urlValid ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {urlValidationMsg}
                  </p>
                )}

                <p className="text-xs text-slate-500 mt-2">
                  Paste the URL from your Google Maps business listing to fetch reviews automatically.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="btn-shimmer w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-600/30"
              >
                Next →
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Business name - Display only */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  {hasExisting ? "Location name" : "Business name"}
                </label>
                <div className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm">
                  {name}
                </div>
                <p className="text-xs text-slate-500 mt-1">Cannot be changed</p>
              </div>

              {/* Business type - Display only */}
              {businessType && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Business type
                  </label>
                  <div className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm">
                    {businessType}
                  </div>
                </div>
              )}

              {/* Google Maps URL - Editable */}
              <div>
                <label htmlFor="preview-url" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Google Maps Business URL
                </label>
                <div className="flex gap-2">
                  <input
                    id="preview-url"
                    type="url"
                    value={googleMapsUrl}
                    onChange={(e) => {
                      setGoogleMapsUrl(e.target.value);
                      setUrlValid(false);
                      setUrlValidationMsg("");
                    }}
                    placeholder="https://www.google.com/maps/place/..."
                    className={`flex-1 bg-slate-900 border rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 ${
                      urlValid
                        ? "border-emerald-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        : "border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    }`}
                  />
                  {googleMapsUrl.trim() && !urlValid && (
                    <button
                      type="button"
                      onClick={validateGoogleMapsUrl}
                      disabled={urlValidating}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap"
                    >
                      {urlValidating ? "Verifying..." : "Verify"}
                    </button>
                  )}
                </div>

                {/* Validation message */}
                {urlValidationMsg && (
                  <p className={`text-xs mt-2 ${
                    urlValid ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {urlValidationMsg}
                  </p>
                )}

                <p className="text-xs text-slate-500 mt-2">
                  You can edit this URL if needed.
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-lg px-4 py-3 text-indigo-300 text-sm">
                <p className="font-medium mb-1">✓ Details Confirmed</p>
                <p>Ready to set up your dashboard.</p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  disabled={loading}
                  className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-shimmer flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-600/30"
                >
                  {loading
                    ? (hasExisting ? "Adding location…" : "Setting up your dashboard…")
                    : (hasExisting ? "Add Location →" : "Continue to Dashboard →")
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
