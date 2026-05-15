/**
 * Sign Up Page — /auth/signup
 *
 * Collects email + password, calls Supabase signUp.
 * Supabase sends a confirmation email — user must click it before logging in.
 * After clicking, they land on /auth/callback which creates the session.
 *
 * Uses the browser Supabase client since this runs in the browser.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  // "idle" | "success" | "error"
  const [status, setStatus]     = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    const supabase = createClient();

    // Capture `data` — when email confirmation is OFF, data.session is set immediately
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Used when email confirmation is ON — callback exchanges code for session
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
      setLoading(false);
      return;
    }

    if (data.session) {
      // Email confirmation is OFF — user is logged in immediately, go to home
      router.push("/home");
      router.refresh();
      return;
    }

    // Email confirmation is ON — session is null, show "check your email" message
    setStatus("success");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center px-4">

      {/* Background orb — same style as landing page */}
      <div className="orb orb-1 opacity-10" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md">

        {/* Card */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm shadow-2xl shadow-black/40">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              RR
            </div>
            <span className="font-semibold text-lg">ReviewResponder</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm mb-8">
            Start your free 14-day trial. No credit card required.
          </p>

          {/* ── Success state — show after signup email is sent ── */}
          {status === "success" ? (
            <div className="bg-emerald-950/50 border border-emerald-700 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">📧</div>
              <h2 className="text-emerald-300 font-semibold mb-2">Check your email</h2>
              <p className="text-slate-400 text-sm">
                We sent a confirmation link to{" "}
                <span className="text-white font-medium">{email}</span>.
                Click it to activate your account and get started.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-5">

              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourbusiness.com"
                  className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200"
                />
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200"
                />
              </div>

              {/* Error message */}
              {status === "error" && (
                <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">
                  {errorMsg}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-shimmer w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-600/30"
              >
                {loading ? "Creating account…" : "Create account"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-slate-500 text-xs">or</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>

              {/* Already have account */}
              <p className="text-center text-slate-400 text-sm">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>

        {/* Back to home */}
        <p className="text-center mt-6 text-slate-600 text-sm">
          <Link href="/" className="hover:text-slate-400 transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
