"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState(
    searchParams.get("error") === "auth_callback_failed"
      ? "Email confirmation failed. Please try signing up again."
      : ""
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const redirectTo = searchParams.get("redirectTo") ?? "/home";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center px-4">

      <div className="orb orb-2 opacity-10" aria-hidden="true" />

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

          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-8">
            Sign in to your account to continue.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
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

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <span className="text-xs text-slate-500 cursor-not-allowed" title="Coming soon">
                  Forgot password?
                </span>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200"
              />
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-shimmer w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-600/30"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-slate-500 text-xs">or</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            {/* Create account */}
            <p className="text-center text-slate-400 text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Sign up free
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center mt-6 text-slate-600 text-sm">
          <Link href="/" className="hover:text-slate-400 transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
