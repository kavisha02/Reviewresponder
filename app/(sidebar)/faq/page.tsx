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
        a: "ReviewResponder is an AI-powered platform that helps businesses monitor Google reviews and respond to them quickly. The AI drafts professional responses in seconds — you review, edit if needed, and save them.",
      },
      {
        q: "How do I add my business?",
        a: "After signing in, go to your Home page and click 'Add Location'. Enter your business name, type, and Google Maps URL, and ReviewResponder will create a dedicated dashboard for it. You can add multiple locations — each gets its own review feed and analytics.",
      },
      {
        q: "How are reviews fetched?",
        a: "Reviews are synced automatically from your provided Google Maps URL. You can also manually sync new reviews by clicking the 'Sync from Google Maps' button on your dashboard.",
      },
    ],
  },
  {
    category: "AI Responses",
    items: [
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
        a: "'Needs Response' means the review has no reply yet. 'Draft Ready' means the AI has generated a response waiting for your review. 'Responded' means the response has been finalized and published. 'Ignored' means you chose to skip the review.",
      },
      {
        q: "Why are some reviews highlighted in red?",
        a: "Reviews with 1 or 2 stars are flagged as urgent because unanswered negative reviews hurt your Google ranking. The dashboard shows a count of these in the 'Needs Attention' stat and highlights the cards with a red accent.",
      },
      {
        q: "Can I manage multiple business locations?",
        a: "Yes. Use the location switcher in the top navigation bar to switch between locations. Each location has its own review feed, stats, and analytics. You can add a new location any time from the Home page.",
      },
      {
        q: "Can I sort or filter my reviews?",
        a: "Yes, you can use the sorting options on your dashboard to sort reviews by date (newest/oldest) or rating (highest/lowest). This helps you prioritize which reviews to respond to first.",
      },
    ],
  },
  {
    category: "Deep Analysis",
    items: [
      {
        q: "What is the 'Deep Analysis' feature?",
        a: "Deep Analysis goes beyond standard metrics to provide a comprehensive, AI-driven breakdown of your reviews. It analyzes the text of your reviews to extract actionable business insights, identify recurring themes, and evaluate customer sentiment.",
      },
      {
        q: "How does Topic Analysis work?",
        a: "Topic Analysis automatically categorizes customer feedback into key areas (like Food, Service, Ambiance, or Value). It highlights what customers love and where there is room for improvement, complete with representative quotes from the actual reviews.",
      },
      {
        q: "What does Sentiment Analysis tell me?",
        a: "Sentiment Analysis evaluates the emotional tone of your reviews. It breaks down the feedback into Positive, Neutral, and Negative sentiments, helping you understand the overall mood of your customers at a glance.",
      },
      {
        q: "What are Actionable Insights?",
        a: "Actionable Insights are specific, data-backed recommendations generated from your reviews. If multiple customers mention slow service during lunch, the system will highlight this trend so you can address it directly.",
      },
    ],
  },
  {
    category: "Notifications & Alerts",
    items: [
      {
        q: "Will I get notified when I receive a bad review?",
        a: "Yes. You can enable 'Negative Alerts' in your Notification Settings. Whenever a review with 1 or 2 stars is synced, the system will immediately send you an email alert so you can respond promptly.",
      },
      {
        q: "Can I get a summary of my reviews?",
        a: "Absolutely. You can enable 'Weekly Digests' to receive a scheduled email summarizing your review activity, including your average rating, total new reviews, and overall response rate. You can customize the day and time you receive this digest.",
      },
    ],
  },
  {
    category: "Analytics",
    items: [
      {
        q: "What does the Analytics page show?",
        a: "The Analytics page gives you a full breakdown: rating distribution (1–5★), review status breakdown, monthly review volume over the last 6 months, sentiment analysis (positive/neutral/negative), language breakdown, and key insight callouts.",
      },
      {
        q: "How is the 'Response Rate' measured?",
        a: "The Response Rate shows what percentage of your reviews have been successfully answered. It helps you track your engagement and ensure no customer feedback goes ignored.",
      },
    ],
  },
  {
    category: "Privacy & Security",
    items: [
      {
        q: "Is my review data secure?",
        a: "Yes. All data is securely stored and isolated. You can only access your own businesses and reviews through an encrypted and authenticated session.",
      },
      {
        q: "Are my finalized responses automatically posted to Google?",
        a: "Yes, once you connect your Google Business Profile account. Until then, you can copy the finalized responses and paste them directly into your Google Business Profile.",
      },

    ],
  },
];

export default function FaqPage() {
  return (
    <main className="text-slate-100">

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
