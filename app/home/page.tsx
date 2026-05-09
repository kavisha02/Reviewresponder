/**
 * Home Page — /home
 *
 * Post-login hub. The first page a user sees after signing in.
 *
 * Shows:
 *   - Welcome header with user email
 *   - Quick stats row (only when the user has at least one business)
 *   - 5 navigation cards: Reviews, Analytics, Add Location, FAQs, Help
 *
 * If the user has no businesses yet, cards link to setup first.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch businesses
  const { data: businesses, count: bizCount } = await supabase
    .from("businesses")
    .select("id, name", { count: "exact" })
    .eq("user_id", user.id);

  const hasBusinesses = (bizCount ?? 0) > 0;
  const firstBizId    = businesses?.[0]?.id ?? "";

  // Fetch aggregate review stats (only if businesses exist)
  let totalReviews  = 0;
  let responded     = 0;
  let needsAttention = 0;

  if (hasBusinesses) {
    const businessIds = (businesses ?? []).map((b) => b.id);

    const { count: total } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .in("business_id", businessIds);

    const { count: pub } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .in("business_id", businessIds)
      .eq("status", "published");

    const { count: urgent } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .in("business_id", businessIds)
      .eq("status", "new")
      .lte("rating", 2);

    totalReviews   = total   ?? 0;
    responded      = pub     ?? 0;
    needsAttention = urgent  ?? 0;
  }

  const responseRate = totalReviews > 0
    ? Math.round((responded / totalReviews) * 100)
    : 0;

  const firstName = user.email?.split("@")[0] ?? "there";

  // Nav card definitions
  const cards = [
    {
      href:        hasBusinesses ? `/dashboard?business=${firstBizId}` : "/dashboard/setup",
      icon:        "📋",
      iconBg:      "from-indigo-500 to-violet-600",
      title:       "Reviews",
      description: hasBusinesses
        ? "View and respond to all your customer reviews with AI-generated replies."
        : "Set up your first business to start managing reviews.",
      cta:         hasBusinesses ? "Open Reviews →" : "Set Up Now →",
      badge:       needsAttention > 0 ? `${needsAttention} urgent` : null,
      badgeColor:  "bg-red-900/60 text-red-300 border-red-700/50",
      border:      "hover:border-indigo-700/60",
    },
    {
      href:        hasBusinesses ? `/dashboard/analytics?business=${firstBizId}` : "/dashboard/setup",
      icon:        "📊",
      iconBg:      "from-emerald-500 to-teal-600",
      title:       "Analytics",
      description: "Full analytics report — rating trends, sentiment breakdown, monthly volume, and more.",
      cta:         "View Analytics →",
      badge:       null,
      badgeColor:  "",
      border:      "hover:border-emerald-700/60",
    },
    {
      href:        hasBusinesses ? `/dashboard/analyse-deeply?business=${firstBizId}` : "/dashboard/setup",
      icon:        "🔍",
      iconBg:      "from-purple-500 to-pink-600",
      title:       "Analyse Deeply",
      description: "Deep insights with category analysis, sentiment breakdown, and featured top reviews.",
      cta:         "Deep Analysis →",
      badge:       null,
      badgeColor:  "",
      border:      "hover:border-purple-700/60",
    },
    {
      href:        "/dashboard/setup",
      icon:        "📍",
      iconBg:      "from-sky-500 to-blue-600",
      title:       "Add Location",
      description: "Manage multiple branches or business locations, each with its own review dashboard.",
      cta:         "Add Location →",
      badge:       hasBusinesses ? `${bizCount ?? 0} active` : null,
      badgeColor:  "bg-sky-900/50 text-sky-300 border-sky-700/50",
      border:      "hover:border-sky-700/60",
    },
    {
      href:        "/faq",
      icon:        "❓",
      iconBg:      "from-yellow-500 to-orange-500",
      title:       "FAQs",
      description: "Answers to the most common questions about ReviewResponder and how it works.",
      cta:         "Read FAQs →",
      badge:       null,
      badgeColor:  "",
      border:      "hover:border-yellow-700/60",
    },
    {
      href:        "/help",
      icon:        "🆘",
      iconBg:      "from-pink-500 to-rose-600",
      title:       "Help & Support",
      description: "Step-by-step guides, tips for getting the most out of AI responses, and support info.",
      cta:         "Get Help →",
      badge:       null,
      badgeColor:  "",
      border:      "hover:border-pink-700/60",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">

      {/* ── Orb decorations ── */}
      <div className="orb orb-1 opacity-10 fixed" aria-hidden="true" />
      <div className="orb orb-2 opacity-5  fixed" aria-hidden="true" />

      {/* ── Navbar ── */}
      <nav className="navbar-blur sticky top-0 z-50 w-full">
        <div className="flex items-center justify-between px-6 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <Link
              href="/home"
              className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-sm hover:opacity-80 transition-opacity"
            >
              RR
            </Link>
            <span className="font-semibold text-white">ReviewResponder</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm hidden md:block">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">

        {/* ── Welcome section ── */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              {firstName}
            </span>{" "}
            👋
          </h1>
          <p className="text-slate-400 text-base">
            Everything you need to manage your business reputation — all in one place.
          </p>
        </div>

        {/* ── Quick stats row (only when businesses exist) ── */}
        {hasBusinesses && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {[
              { label: "Locations",        value: bizCount ?? 0,     color: "text-sky-400" },
              { label: "Total Reviews",    value: totalReviews,       color: "text-white" },
              { label: "Response Rate",    value: `${responseRate}%`, color: "text-emerald-400" },
              {
                label: "Needs Attention",
                value: needsAttention,
                color: needsAttention > 0 ? "text-red-400" : "text-slate-500",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-slate-800/60 border border-slate-700 rounded-xl p-4"
              >
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-slate-400 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── First-time empty state banner ── */}
        {!hasBusinesses && (
          <div className="mb-10 bg-indigo-950/40 border border-indigo-800/50 rounded-xl p-5 flex items-start gap-4">
            <span className="text-3xl mt-0.5">🚀</span>
            <div>
              <div className="text-indigo-300 font-semibold mb-1">You&apos;re almost set up!</div>
              <p className="text-slate-400 text-sm">
                Add your first business location to start collecting and responding to reviews.
              </p>
              <Link
                href="/dashboard/setup"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Add your first business →
              </Link>
            </div>
          </div>
        )}

        {/* ── Navigation cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`group relative bg-slate-800/60 border border-slate-700 ${card.border} rounded-2xl p-6 transition-all duration-300 hover:bg-slate-800/90 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5`}
            >
              {/* Badge */}
              {card.badge && (
                <span className={`absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full border font-medium ${card.badgeColor}`}>
                  {card.badge}
                </span>
              )}

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.iconBg} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {card.icon}
              </div>

              {/* Content */}
              <h2 className="text-white font-semibold text-lg mb-2">{card.title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">{card.description}</p>

              {/* CTA */}
              <span className="text-sm font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors">
                {card.cta}
              </span>
            </Link>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-600">
          <span>ReviewResponder · Manage your reputation with AI</span>
          <div className="flex gap-4">
            <Link href="/faq"  className="hover:text-slate-400 transition-colors">FAQ</Link>
            <Link href="/help" className="hover:text-slate-400 transition-colors">Help</Link>
            <Link href="/"     className="hover:text-slate-400 transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
