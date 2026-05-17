"use client";

import { useState } from "react";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$20",
    description: "Perfect for single-location small businesses.",
    credits: "500 Credits / mo",
    features: [
      "Basic Analytics Dashboard",
      "Track up to 1 Competitor",
      "Manual Review Responses",
    ],
    missingFeatures: [
      "AI Auto-Responder",
      "Deep AI Analysis",
      "Automated Daily Digests",
    ],
    buttonText: "Get Starter",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$40",
    description: "Ideal for growing businesses and multi-locations.",
    credits: "1,500 Credits / mo",
    features: [
      "Everything in Starter",
      "AI Auto-Responder",
      "Reputation Scorecard",
      "Track up to 3 Competitors",
    ],
    missingFeatures: [
      "Deep AI Analysis",
      "Automated Daily Digests",
    ],
    buttonText: "Get Pro",
    popular: false,
  },
  {
    id: "elite",
    name: "Elite",
    price: "$50",
    description: "Maximum value for agencies and franchises.",
    credits: "3,000 Credits / mo",
    features: [
      "Everything in Pro",
      "Deep AI Analysis (Topics/Sentiment)",
      "Automated Daily Email Digests",
      "Track Unlimited Competitors",
    ],
    missingFeatures: [],
    buttonText: "Upgrade to Elite",
    popular: true,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout failed: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to initiate checkout.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Scale your review management effortlessly. Pay for what you need. 
            <br />
            <span className="text-indigo-400 font-semibold">1 Credit = 1 Review Synced & Analyzed.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-slate-800/60 border rounded-2xl p-8 flex flex-col ${
                plan.popular ? "border-indigo-500 shadow-lg shadow-indigo-500/20" : "border-slate-700"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">
                  BEST VALUE
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 h-10">{plan.description}</p>
                <div className="mt-4 flex items-baseline text-white">
                  <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className="ml-1 text-xl font-semibold text-slate-400">/mo</span>
                </div>
                <div className="mt-4 text-emerald-400 font-bold text-lg bg-emerald-500/10 inline-block px-3 py-1 rounded-lg">
                  {plan.credits}
                </div>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <svg className="h-6 w-6 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-slate-300">{feature}</span>
                  </li>
                ))}
                {plan.missingFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start opacity-50">
                    <svg className="h-6 w-6 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="ml-3 text-slate-500">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading !== null}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                    : "bg-slate-700 hover:bg-slate-600 text-white"
                }`}
              >
                {loading === plan.id ? "Processing..." : plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
