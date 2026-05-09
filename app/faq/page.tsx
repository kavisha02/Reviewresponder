/**
 * FAQ Page — /faq
 *
 * Frequently asked questions about ReviewResponder.
 * Covers: how it works, AI responses, Google integration,
 *         multi-location, pricing, privacy.
 */

import Link from "next/link";

const FAQS = [
  {
    category: "Getting Started",
    items: [
      {
        q: "What is ReviewResponder?",
        a: "ReviewResponder is an AI-powered platform that helps businesses monitor Google reviews and respond to them quickly. The AI drafts professional responses in seconds — you review, edit if needed, and save them to your dashboard.",
      },
      {
        q: "How do I add my business?",
        a: "After signing in, go to your Home page and click 'Add Location'. Enter your business name and type, and ReviewResponder will create a dedicated dashboard for it. You can add multiple locations — each gets its own review feed and analytics.",
      },
      {
        q: "Do I need a Google Business Profile?",
        a: "For the current version, reviews are seeded as mock data for demonstration. In the upcoming Google API phase, you'll connect your Google Business Profile account and real reviews will sync automatically.",
      },
    ],
  },
  {
    category: "AI Responses",
    items: [
      {
        q: "How does the AI generate responses?",
        a: "When you click 'Generate AI Response' on a review, ReviewResponder sends the review text, star rating, and your business type to Google Gemini. The AI crafts a tone-appropriate reply — warm and grateful for positive reviews, empathetic and solution-oriented for negative ones.",
      },
      {
        q: "Can I edit the AI draft?",
        a: "Absolutely. Every AI draft shows an 'Edit' button. Click it to open an inline text editor where you can change any word, adjust the tone, or add personalised details. Your edits are saved to the draft.",
      },
      {
        q: "What if I don't like the draft — can I regenerate?",
        a: "Yes. While a review is in 'Draft Ready' state, a 'Regenerate' button appears. Each regeneration produces a completely new response. You can regenerate as many times as you like to find the perfect draft.",
      },
      {
        q: "Does the AI respond in Hindi or other languages?",
        a: "The AI detects the language of the review and tries to match it. Reviews written in Hindi (Devanagari) or Hinglish typically receive responses in the same language. You can always edit the draft to adjust the language or mix of languages.",
      },
    ],
  },
  {
    category: "Reviews & Dashboard",
    items: [
      {
        q: "What do the review statuses mean?",
        a: "'Needs Response' means the review has no reply yet. 'Draft Ready' means the AI has generated a response waiting for your review. 'Ignored' means you chose to skip the review.",
      },
      {
        q: "Why are some reviews highlighted in red?",
        a: "Reviews with 1 or 2 stars are flagged as urgent because unanswered negative reviews hurt your Google ranking. The dashboard shows a count of these in the 'Needs Attention' stat and highlights the cards with a red accent.",
      },
      {
        q: "Can I manage multiple business locations?",
        a: "Yes. Use the location switcher in the top navigation bar to switch between locations. Each location has its own review feed, stats, and analytics. You can add a new location any time from the Home page.",
      },
    ],
  },
  {
    category: "Analytics",
    items: [
      {
        q: "What does the Analytics page show?",
        a: "The Analytics page gives you a full breakdown: rating distribution (1–5★), review status breakdown, monthly review volume over the last 6 months, sentiment analysis (positive/neutral/negative), language breakdown (English/Hindi/Hinglish), and key insight callouts.",
      },
      {
        q: "How is 'Response Rate' calculated?",
        a: "Response Rate = (number of 'Draft Ready' reviews ÷ total reviews) × 100. This shows what percentage of reviews you've drafted responses for.",
      },
    ],
  },
  {
    category: "Privacy & Security",
    items: [
      {
        q: "Is my review data secure?",
        a: "Yes. All data is stored in Supabase with Row Level Security (RLS) enabled — each user can only access their own businesses and reviews. Authentication is handled by Supabase Auth with encrypted sessions.",
      },
      {
        q: "Can I post responses to Google?",
        a: "The current version saves draft responses in your dashboard. You can copy the response and paste it manually in your Google Business Profile. Automatic posting to Google is planned for a future phase.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">

      {/* ── Navbar ── */}
      <nav className="navbar-blur sticky top-0 z-50 w-full">
        <div className="flex items-center justify-between px-6 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Link
              href="/home"
              className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-sm hover:opacity-80 transition-opacity"
            >
              RR
            </Link>
            <span className="font-semibold text-white">ReviewResponder</span>
          </div>
          <Link
            href="/home"
            className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all duration-200"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="text-5xl mb-4">❓</div>
          <h1 className="text-3xl font-bold text-white mb-3">Frequently Asked Questions</h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Everything you need to know about ReviewResponder. Can't find your answer?{" "}
            <Link href="/help" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Visit the Help page.
            </Link>
          </p>
        </div>

        {/* FAQ sections */}
        <div className="space-y-8">
          {FAQS.map((section) => (
            <div key={section.category}>
              {/* Category label */}
              <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-4">
                {section.category}
              </h2>

              <div className="space-y-3">
                {section.items.map((item) => (
                  <details
                    key={item.q}
                    className="group bg-slate-800/60 border border-slate-700 hover:border-slate-600 rounded-xl overflow-hidden transition-colors duration-200"
                  >
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none">
                      <span className="text-white font-medium text-sm pr-4">{item.q}</span>
                      {/* Chevron */}
                      <svg
                        className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 group-open:rotate-180"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-5 pb-5 pt-1 text-slate-400 text-sm leading-relaxed border-t border-slate-700/60">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 bg-indigo-950/40 border border-indigo-800/50 rounded-xl p-6 text-center">
          <p className="text-slate-300 font-medium mb-2">Still have questions?</p>
          <p className="text-slate-500 text-sm mb-4">
            Check the Help page for step-by-step guides and support options.
          </p>
          <Link
            href="/help"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            Visit Help Center →
          </Link>
        </div>
      </div>
    </main>
  );
}
