/**
 * Landing Page — Enhanced Visual Design (Phase 1)
 *
 * Sections on this page:
 *  1. Navbar        — sticky, glassmorphism blur
 *  2. Hero          — animated gradient heading, floating orbs, stats row
 *  3. How It Works  — 3-step numbered timeline
 *  4. Features      — hover-glow cards with icons
 *  5. Testimonials  — 3 social proof quotes
 *  6. Pricing       — 3 tiers, hover scale + glow
 *  7. CTA Banner    — full-width animated gradient
 *  8. Footer        — links + copyright
 *
 * All buttons are placeholders — wired up to real auth in Phase 2.
 * All styles use Tailwind utilities + custom CSS from globals.css.
 */

// Link is needed to navigate to auth pages without a full page reload
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. NAVBAR — sticky top, frosted glass effect
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav className="navbar-blur sticky top-0 z-50 w-full">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">

          {/* Logo mark + name */}
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              RR
            </div>
            <span className="font-semibold text-lg tracking-tight">ReviewResponder</span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-6">
            <a
              href="#how-it-works"
              className="text-slate-400 hover:text-white text-sm transition-colors duration-200 hover:underline underline-offset-4 decoration-indigo-500"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-slate-400 hover:text-white text-sm transition-colors duration-200 hover:underline underline-offset-4 decoration-indigo-500"
            >
              Pricing
            </a>
            <Link href="/auth/login" className="text-slate-400 hover:text-white text-sm transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700">
              Sign In
            </Link>
            <Link href="/auth/signup" className="btn-shimmer bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm px-4 py-2 rounded-lg transition-all duration-300 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:scale-105 font-medium">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. HERO — animated headline, orbs, stats
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative dot-grid overflow-hidden">

        {/* Floating gradient orbs — purely decorative */}
        <div className="orb orb-1" aria-hidden="true" />
        <div className="orb orb-2" aria-hidden="true" />
        <div className="orb orb-3" aria-hidden="true" />

        {/* Content sits above the orbs */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-28 text-center">

          {/* Platform badge */}
          <div className="fade-in-up inline-flex items-center gap-2 bg-indigo-950/70 border border-indigo-700/50 text-indigo-300 text-xs font-medium px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            Works with Google Business · US &amp; India
          </div>

          {/* Main headline with animated gradient */}
          <h1 className="fade-in-up fade-in-up-delay-1 text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            Never leave a review
            <br />
            <span className="gradient-text">unanswered again</span>
          </h1>

          {/* Sub-headline */}
          <p className="fade-in-up fade-in-up-delay-2 text-slate-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            ReviewResponder monitors your Google Business reviews 24/7, drafts
            AI-powered responses in your tone, and alerts you the moment a
            negative review lands.
          </p>

          <div className="fade-in-up fade-in-up-delay-3 flex items-center justify-center gap-4 flex-wrap mb-6">
            <Link href="/auth/signup" className="btn-shimmer bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-all duration-300 shadow-xl shadow-indigo-600/40 hover:shadow-indigo-500/60 hover:scale-105">
              Start Free Trial
            </Link>
            <a href="#how-it-works" className="group flex items-center gap-2 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-indigo-950/30">
              See How It Works
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
          </div>

          {/* Trust line */}
          <p className="text-slate-600 text-sm">
            No credit card required · 14-day free trial · Cancel anytime
          </p>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-xl mx-auto">
            {[
              { value: "500+",  label: "Businesses" },
              { value: "50K+",  label: "Reviews Managed" },
              { value: "4.9★",  label: "Avg Response Rating" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="stat-card bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-4 backdrop-blur-sm cursor-default"
              >
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-slate-400 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Glowing divider ── */}
      <div className="glow-divider mx-8" />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. HOW IT WORKS — numbered steps
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-24">
        <h2 className="text-center text-3xl font-bold text-white mb-4">
          Up and running in 3 steps
        </h2>
        <p className="text-center text-slate-400 mb-16">
          No developer needed. Connect once, monitor forever.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">

          {/* Connector line — visible on desktop only */}
          <div className="hidden md:block absolute top-8 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-indigo-500/50 via-violet-500/50 to-indigo-500/50" />

          {[
            {
              step: "01",
              icon: "🔗",
              title: "Connect Google",
              body: "Sign up and link your Google Business Profile with one OAuth click. Takes under 60 seconds.",
            },
            {
              step: "02",
              icon: "🤖",
              title: "AI Drafts Responses",
              body: "Every new review instantly gets a human-sounding draft response tailored to your business tone.",
            },
            {
              step: "03",
              icon: "✅",
              title: "Approve & Publish",
              body: "Review the draft, edit if needed, and publish to Google in one click — or set it to auto-publish.",
            },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center group cursor-default">
              {/* Step number circle */}
              <div className="step-number w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center text-white font-bold text-lg mb-4 shadow-lg shadow-indigo-600/40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 relative z-10">
                {item.step}
              </div>
              {/* Icon */}
              <div className="text-3xl mb-3 transition-transform duration-300 group-hover:scale-125">
                {item.icon}
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Glowing divider ── */}
      <div className="glow-divider mx-8" />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. FEATURES — hover-glow cards
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-center text-3xl font-bold text-white mb-4">
          Everything you need to win on reviews
        </h2>
        <p className="text-center text-slate-400 mb-16">
          Built specifically for local businesses — not enterprise bloat.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "🚨",
              iconBg: "bg-red-950/60",
              iconGlow: "shadow-red-500/20",
              title: "Instant Negative Alerts",
              body: "Get notified within 5 minutes when a 1 or 2-star review lands — via email and WhatsApp — before it damages your ranking.",
            },
            {
              icon: "🤖",
              iconBg: "bg-indigo-950/60",
              iconGlow: "shadow-indigo-500/20",
              title: "AI Draft Responses",
              body: "Every review gets a human-sounding draft in your tone — professional, friendly, or casual. Edit or publish in one click.",
            },
            {
              icon: "📈",
              iconBg: "bg-emerald-950/60",
              iconGlow: "shadow-emerald-500/20",
              title: "Reputation Analytics",
              body: "Track average rating trends, response rate, and sentiment week-over-week. Understand exactly what customers are saying.",
            },
            {
              icon: "⚡",
              iconBg: "bg-yellow-950/60",
              iconGlow: "shadow-yellow-500/20",
              title: "Auto-Publish",
              body: "Set it and forget it for positive reviews. Enable auto-publish and every 4-5 star review gets responded to automatically.",
            },
            {
              icon: "🌐",
              iconBg: "bg-violet-950/60",
              iconGlow: "shadow-violet-500/20",
              title: "Multi-Language Support",
              body: "Respond in English, Hindi, or Hinglish. Perfect for Indian businesses that serve diverse customer bases.",
            },
            {
              icon: "🏢",
              iconBg: "bg-cyan-950/60",
              iconGlow: "shadow-cyan-500/20",
              title: "Multi-Location",
              body: "Manage reviews for all your branches from one dashboard. Agency plan supports up to 10 locations.",
            },
          ].map((feat) => (
            <div
              key={feat.title}
              className="card-glow bg-slate-800/70 border border-slate-700 rounded-2xl p-6 cursor-default"
            >
              {/* Icon box */}
              <div className={`w-12 h-12 ${feat.iconBg} rounded-xl flex items-center justify-center text-2xl mb-5 shadow-lg ${feat.iconGlow} transition-transform duration-300 hover:scale-110`}>
                {feat.icon}
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Glowing divider ── */}
      <div className="glow-divider mx-8" />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. TESTIMONIALS — social proof
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-center text-3xl font-bold text-white mb-4">
          Businesses love it
        </h2>
        <p className="text-center text-slate-400 mb-16">
          From salons in Mumbai to clinics in Chicago.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "We were losing customers to bad reviews we never responded to. ReviewResponder changed that overnight. Our rating went from 4.1 to 4.6 in two months.",
              name: "Priya Sharma",
              role: "Owner, Bloom Salon · Mumbai",
              stars: 5,
            },
            {
              quote: "The negative review alert is a lifesaver. I got pinged on WhatsApp within minutes and was able to respond and resolve the issue before it went viral.",
              name: "Marcus Johnson",
              role: "Manager, QuickFix Auto · Chicago",
              stars: 5,
            },
            {
              quote: "Running 6 clinics meant 6 Google profiles to monitor. This dashboard makes it feel like managing one. The AI drafts are surprisingly good.",
              name: "Dr. Arvind Patel",
              role: "Director, CareFirst Clinics · Ahmedabad",
              stars: 5,
            },
          ].map((t) => (
            <div
              key={t.name}
              className="testimonial-card bg-slate-800/60 border border-slate-700 rounded-2xl p-6 cursor-default"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm">★</span>
                ))}
              </div>
              {/* Quote */}
              <p className="text-slate-300 text-sm leading-relaxed mb-5 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              {/* Author */}
              <div className="flex items-center gap-3">
                {/* Avatar placeholder — initials */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{t.name}</div>
                  <div className="text-slate-500 text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Glowing divider ── */}
      <div className="glow-divider mx-8" />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          6. PRICING — hover scale + glow
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-center text-3xl font-bold text-white mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-center text-slate-400 mb-16">
          USD for the US · INR for India · Same features, local pricing.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Starter */}
          <div className="pricing-card bg-slate-800/70 border border-slate-700 rounded-2xl p-6 cursor-default flex flex-col">
            <h3 className="font-bold text-white text-lg mb-1">Starter</h3>
            <p className="text-slate-400 text-xs mb-4">Try it out, no commitment</p>
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-white">Free</span>
            </div>
            <ul className="space-y-2 text-xs mb-6 flex-1">
              {["1 business location", "Up to 20 reviews / month", "AI draft responses"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span> {f}
                </li>
              ))}
              {["Auto-publish", "WhatsApp alerts"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-slate-600">
                  <span className="font-bold">✗</span> {f}
                </li>
              ))}
            </ul>
            <button className="w-full border border-slate-600 hover:border-indigo-500 text-slate-300 hover:text-white py-2.5 rounded-lg text-xs font-medium transition-all duration-300 hover:bg-indigo-950/30">
              Get Started Free
            </button>
          </div>

          {/* Pro — highlighted with glow */}
          <div className="pricing-card bg-gradient-to-b from-indigo-950 to-slate-900 border-2 border-indigo-500 rounded-2xl p-6 relative cursor-default shadow-2xl shadow-indigo-500/20 flex flex-col">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs px-3 py-0.5 rounded-full font-semibold shadow-lg">
              Most Popular
            </span>
            <h3 className="font-bold text-white text-lg mb-1">Pro</h3>
            <p className="text-slate-400 text-xs mb-4">For active businesses</p>
            <div className="mb-2">
              <span className="text-3xl font-extrabold text-white">$29</span>
              <span className="text-slate-400 text-xs"> /month</span>
            </div>
            <p className="text-indigo-300 text-xs mb-6">₹499 / month for India</p>
            <ul className="space-y-2 text-xs mb-6 flex-1">
              {[
                "1 business location",
                "Unlimited reviews",
                "AI draft responses",
                "Auto-publish positive reviews",
                "Email + WhatsApp alerts",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-slate-200">
                  <span className="text-emerald-400 font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <button className="btn-shimmer w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 shadow-lg shadow-indigo-600/30">
              Start Free Trial
            </button>
          </div>

          {/* Agency */}
          <div className="pricing-card bg-slate-800/70 border border-slate-700 rounded-2xl p-6 cursor-default flex flex-col">
            <h3 className="font-bold text-white text-lg mb-1">Agency</h3>
            <p className="text-slate-400 text-xs mb-4">Manage multiple clients</p>
            <div className="mb-2">
              <span className="text-3xl font-extrabold text-white">$79</span>
              <span className="text-slate-400 text-xs"> /month</span>
            </div>
            <p className="text-indigo-300 text-xs mb-6">₹1499 / month for India</p>
            <ul className="space-y-2 text-xs mb-6 flex-1">
              {[
                "Up to 10 locations",
                "Unlimited reviews",
                "Everything in Pro",
                "Client reporting",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <button className="w-full border border-slate-600 hover:border-indigo-500 text-slate-300 hover:text-white py-2.5 rounded-lg text-xs font-medium transition-all duration-300 hover:bg-indigo-950/30">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          7. CTA BANNER — animated gradient background
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="cta-gradient mx-6 md:mx-16 rounded-3xl px-8 py-16 text-center mb-16 border border-indigo-800/50 shadow-2xl shadow-indigo-900/50">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to take control of your reputation?
        </h2>
        <p className="text-indigo-200 mb-8 max-w-xl mx-auto">
          Join 500+ businesses who never miss a review. Start your free 14-day
          trial — no credit card required.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/auth/signup" className="btn-shimmer bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-8 py-3.5 rounded-xl text-lg transition-all duration-300 hover:scale-105 shadow-xl">
            Start Free Trial
          </Link>
          <button className="border border-indigo-400/50 hover:border-indigo-300 text-indigo-200 hover:text-white px-8 py-3.5 rounded-xl text-lg font-medium transition-all duration-300">
            Book a Demo
          </button>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          8. FOOTER
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="border-t border-slate-800 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Logo in footer */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
              RR
            </div>
            <span className="font-semibold text-slate-300">ReviewResponder</span>
          </div>

          {/* Footer links */}
          <div className="flex gap-6 text-sm text-slate-500">
            {["Privacy Policy", "Terms of Service", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="hover:text-slate-300 transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </div>

          <p className="text-slate-600 text-sm">
            © 2025 ReviewResponder · US &amp; India
          </p>
        </div>
      </footer>

    </main>
  );
}
