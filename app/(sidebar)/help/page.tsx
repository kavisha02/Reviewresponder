/**
 * Help Page — /help
 *
 * Step-by-step usage guides, tips for getting the best out of AI responses,
 * and support information for ReviewResponder users.
 */

import Link from "next/link";
import ContactForm from "@/components/ContactForm";

const GUIDES = [
  {
    step: "01",
    title: "Add Your Business",
    description: "Go to Home → Add Location. Enter your business name and select a business type (e.g. Restaurant, Salon). This helps the AI tailor responses to your industry's tone and context.",
    icon: "📍",
    color: "from-sky-500 to-blue-600",
  },
  {
    step: "02",
    title: "Review Your Incoming Reviews",
    description: "Open the Reviews dashboard. Reviews are shown newest first. Red-bordered cards are low-rated (1–2★) and need urgent attention. Start with these to protect your Google ranking.",
    icon: "📋",
    color: "from-indigo-500 to-violet-600",
  },
  {
    step: "03",
    title: "Generate an AI Response",
    description: "Click 'Generate AI Response' on any review. The AI analyses the rating and text, then writes a tone-appropriate draft — warm for 5★, empathetic and solution-focused for 1–2★.",
    icon: "🤖",
    color: "from-violet-500 to-purple-600",
  },
  {
    step: "04",
    title: "Edit the Draft (Optional)",
    description: "Click 'Edit' inside the draft box to personalise the response — add the customer's name, mention a specific detail, or adjust the tone. This takes 10 seconds and makes responses feel human.",
    icon: "✏️",
    color: "from-yellow-500 to-orange-500",
  },
  {
    step: "05",
    title: "Save Your Draft",
    description: "Your draft is automatically saved. You can view all your drafts in the dashboard and copy them to paste into your Google Business Profile manually.",
    icon: "💾",
    color: "from-emerald-500 to-teal-600",
  },
  {
    step: "06",
    title: "Check Analytics",
    description: "Go to Home → Analytics to see your response rate, rating trends over 6 months, sentiment breakdown, and language distribution. Use this to spot problems before they grow.",
    icon: "📊",
    color: "from-pink-500 to-rose-600",
  },
];

const TIPS = [
  {
    icon: "⚡",
    title: "Respond within 24 hours",
    body: "Google tracks how quickly businesses respond to reviews. Faster responses improve your Local Pack ranking.",
  },
  {
    icon: "🎯",
    title: "Always respond to negative reviews",
    body: "Even if a negative review is unfair, a calm, professional response shows future customers you care. Use the AI draft as a starting point.",
  },
  {
    icon: "✍️",
    title: "Personalise at least one detail",
    body: "Adding the customer's name or referencing their specific comment (\"glad the pasta impressed you!\") increases perceived authenticity significantly.",
  },
  {
    icon: "🔄",
    title: "Regenerate if the tone feels off",
    body: "Not happy with a draft? Hit 'Regenerate' — each attempt uses a different phrasing. Try 2–3 times to find the one that fits best.",
  },
  {
    icon: "🌐",
    title: "Hindi & Hinglish reviews",
    body: "The AI can draft responses in Hindi and Hinglish. If the generated response is in the wrong language, edit it or use 'Edit' to rewrite in your preferred language.",
  },
  {
    icon: "📍",
    title: "Use separate locations for each branch",
    body: "If you run multiple outlets, add each as a separate location. Analytics and response rates are tracked independently, so you can spot which branch needs more attention.",
  },
];

const SUPPORT = [
  {
    icon: "❓",
    label: "Read the FAQ",
    description: "Quick answers to the most common questions.",
    href: "/faq",
    cta: "Open FAQ →",
    color: "border-yellow-800/50 hover:border-yellow-700/60",
  },
  {
    icon: "🐛",
    label: "Report an Issue",
    description: "Found a bug? Open a GitHub issue with details.",
    href: "https://github.com/anthropics/claude-code/issues",
    cta: "GitHub Issues →",
    color: "border-slate-700 hover:border-slate-600",
  },
  {
    icon: "🏠",
    label: "Back to Home",
    description: "Return to the hub and pick where to go next.",
    href: "/home",
    cta: "Go Home →",
    color: "border-indigo-800/50 hover:border-indigo-700/60",
  },
];

export default function HelpPage() {
  return (
    <main className="text-slate-100">

      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="text-5xl mb-4">🆘</div>
          <h1 className="text-3xl font-bold text-white mb-3">Help & Support</h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Step-by-step guides, pro tips, and support options. Everything to help you
            get the most out of ReviewResponder.
          </p>
        </div>

        {/* ── How it works: step-by-step ── */}
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-6">
            How it works — step by step
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GUIDES.map((g) => (
              <div
                key={g.step}
                className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 flex gap-4"
              >
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center text-xl shrink-0 shadow-lg`}>
                  {g.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-600 font-mono">{g.step}</span>
                    <h3 className="text-white font-semibold text-sm">{g.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{g.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pro tips ── */}
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-6">
            Pro tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TIPS.map((tip) => (
              <div
                key={tip.title}
                className="bg-slate-800/60 border border-slate-700 rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{tip.icon}</span>
                  <h3 className="text-white font-semibold text-sm">{tip.title}</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Keyboard shortcuts ── */}
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-6">
            Quick reference
          </h2>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Action</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Where</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">How</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {[
                  ["Generate AI response",   "Review card (status: new)",     "Click 'Generate AI Response'"],
                  ["Regenerate draft",        "Review card (status: draft)",   "Click 'Regenerate'"],
                  ["Edit draft",              "Review card (status: draft)",   "Click 'Edit' → modify text"],
                  ["Switch location",        "Any dashboard page",            "Click the location name in the top navbar"],
                  ["View analytics",         "Reviews dashboard",             "Click 'Analytics' button in the page header"],
                  ["Add new location",       "Home page or Reviews dashboard","Click 'Add Location'"],
                ].map(([action, where, how]) => (
                  <tr key={action} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-3 text-white font-medium">{action}</td>
                    <td className="px-5 py-3 text-slate-400">{where}</td>
                    <td className="px-5 py-3 text-slate-400">{how}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Support links ── */}
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-pink-400 uppercase tracking-widest mb-6">
            Support
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SUPPORT.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className={`group bg-slate-800/60 border ${s.color} rounded-xl p-5 transition-all duration-200 hover:bg-slate-800/90`}
              >
                <div className="text-2xl mb-3">{s.icon}</div>
                <h3 className="text-white font-semibold text-sm mb-1">{s.label}</h3>
                <p className="text-slate-400 text-xs mb-3 leading-relaxed">{s.description}</p>
                <span className="text-indigo-400 group-hover:text-indigo-300 text-xs font-medium transition-colors">
                  {s.cta}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Contact form ── */}
        <section>
          <h2 className="text-xs font-semibold text-sky-400 uppercase tracking-widest mb-6">
            Get in Touch
          </h2>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
            <p className="text-slate-300 text-sm mb-6">
              Have a question or issue we haven't covered? Fill out the form below and our support team will get back to you within 24 hours.
            </p>
            <ContactForm />
          </div>
        </section>
      </div>
    </main>
  );
}
