"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function PricingPage() {
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const { user, token, refresh, setShowAuthModal } = useAuth();

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "Rs. 0",
      period: "forever",
      color: "stone",
      features: [
        "1 bill check per day",
        "Slab status dekhein",
        "Slab calculator demo",
        "Basic save tips",
      ],
      cta: "Abhi Shuru Karo",
      href: "/check-bill/",
      popular: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: "Rs. 99",
      period: "/month",
      color: "emerald",
      features: [
        "✅ Unlimited bill checks",
        "✅ WhatsApp slab alerts (daily)",
        "✅ Due date reminder (3 din pehle)",
        "✅ Personalized bachat tips",
        "✅ Slab crossing warning",
        "✅ Bill history tracking",
      ],
      cta: "Pro Upgrade Karein",
      href: "#pro",
      popular: true,
    },
    {
      id: "family",
      name: "Family",
      price: "Rs. 199",
      period: "/month",
      color: "amber",
      features: [
        "✅ Sab Pro features",
        "✅ 5 connections ek account me",
        "✅ Multi-meter tracking",
        "✅ Family bill dashboard",
        "✅ Priority WhatsApp support",
      ],
      cta: "Family Plan Karein",
      href: "#family",
      popular: false,
    },
  ];

  async function handleUpgrade(plan: "pro" | "family") {
    // If not logged in, show auth modal
    if (!user || !token) {
      setShowAuthModal(true);
      return;
    }

    setUpgrading(true);
    try {
      const res = await fetch("/billbachat/api/auth/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan, months: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        await refresh();
        setShowPayment(null);
        alert(`✅ ${plan.toUpperCase()} plan activate ho gaya! Ab unlimited features on hain.`);
      } else {
        alert(`❌ ${data.error || "Upgrade failed"}`);
      }
    } catch {
      alert("❌ Network error");
    } finally {
      setUpgrading(false);
    }
  }

  const currentPlan = user?.effectivePlan || "free";

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-emerald-50 to-white py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-stone-900 mb-4">
            Simple Pricing
          </h1>
          <p className="text-lg text-stone-600">
            Pehle FREE try karein. Jab slab alerts chahiye to Pro lein — sirf{" "}
            <span className="font-bold text-emerald-600">Rs. 99/month</span>.
          </p>
          <p className="text-sm text-stone-400 mt-2">
            ⚡ Ek bill bachao = Rs. 2,000+ bachat. Pro ka paisa 10x wapas.
          </p>

          {user && (
            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold">
              Aapka plan: {currentPlan.toUpperCase()}
              {currentPlan !== "free" && user.planExpiry && (
                <span className="text-emerald-600">
                  (till {new Date(user.planExpiry).toLocaleDateString("en-PK", { day: "numeric", month: "short" })})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl shadow-xl border-2 p-6 sm:p-8 relative ${
                  plan.popular
                    ? "border-emerald-500 ring-2 ring-emerald-200"
                    : "border-stone-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    ⭐ Sabse Popular
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 right-4 bg-stone-800 text-white text-xs font-bold px-3 py-1 rounded-full">
                    ✓ Current Plan
                  </div>
                )}

                <h3 className="text-xl font-extrabold text-stone-900 mb-1">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-extrabold text-stone-900">
                    {plan.price}
                  </span>
                  <span className="text-stone-400 text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <li
                      key={i}
                      className="text-sm text-stone-600 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="block w-full bg-stone-200 text-stone-600 text-center font-bold py-3 rounded-xl">
                    ✓ Active Plan
                  </div>
                ) : plan.id === "free" ? (
                  <Link
                    href={plan.href}
                    className="block w-full bg-stone-800 text-white text-center font-bold py-3 rounded-xl hover:bg-stone-900 transition"
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      if (!user) {
                        setShowAuthModal(true);
                      } else {
                        setShowPayment(plan.id);
                      }
                    }}
                    className={`block w-full font-bold py-3 rounded-xl transition ${
                      plan.popular
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                        : "bg-amber-600 text-white hover:bg-amber-700"
                    }`}
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Payment Modal */}
        {showPayment && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPayment(null)}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-stone-900">
                  {showPayment === "pro"
                    ? "Pro Plan — Rs. 99/month"
                    : "Family Plan — Rs. 199/month"}
                </h3>
                <button
                  onClick={() => setShowPayment(null)}
                  className="text-stone-400 hover:text-stone-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-4 mb-4">
                <p className="font-semibold text-emerald-700 text-sm mb-2">
                  📲 Payment kaise karein:
                </p>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-bold text-stone-700">
                      JazzCash / Easypaisa:
                    </p>
                    <p className="text-stone-600">
                      Is number pe Rs.{" "}
                      {showPayment === "pro" ? "99" : "199"} bhejein:
                    </p>
                    <p className="font-mono font-bold text-emerald-600 text-lg">
                      0322-5490551
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-stone-500 mb-1">
                      Screenshot lein aur WhatsApp pe bhejein:
                    </p>
                    <p className="font-mono text-stone-700">
                      upgrade {showPayment}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      Bot ko ye message bhejein payment screenshot ke saath
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-3 mb-4">
                <p className="text-xs text-amber-700">
                  ⚡ <strong>Instant activation:</strong> Payment verify hote hi
                  Pro features on ho jayenge (24 hours ke andar).
                </p>
              </div>

              {/* Demo instant upgrade button */}
              <button
                onClick={() => handleUpgrade(showPayment as "pro" | "family")}
                disabled={upgrading}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition shadow-lg disabled:opacity-50 mb-2"
              >
                {upgrading
                  ? "Activating..."
                  : "🧪 Demo: Abhi Activate Karo (testing)"}
              </button>

              <p className="text-xs text-stone-400 text-center">
                🔒 Aapka data safe hai. Payment sirf BillBachat bot ke through
                process hota hai.
              </p>
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200">
          <h2 className="text-xl font-bold text-stone-900 mb-4">
            Sawal? Jawab:
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-stone-700">
                Q: Free me kya kya milta hai?
              </p>
              <p className="text-stone-500">
                Roz 1 baar bill check, slab status, aur calculator demo. WhatsApp
                alerts nahi.
              </p>
            </div>
            <div>
              <p className="font-semibold text-stone-700">
                Q: Pro me alerts kab aate hain?
              </p>
              <p className="text-stone-500">
                Jab 180+ units ho jayein (200 ke qareeb), due date 3 din pehle,
                aur slab cross hone par — sab WhatsApp pe.
              </p>
            </div>
            <div>
              <p className="font-semibold text-stone-700">
                Q: Cancel kar sakte hain?
              </p>
              <p className="text-stone-500">
                Haan, kabhi bhi. WhatsApp pe &quot;unsubscribe&quot; bhejein. Koi
                hidden charge nahi.
              </p>
            </div>
            <div>
              <p className="font-semibold text-stone-700">
                Q: Family plan me kya hota hai?
              </p>
              <p className="text-stone-500">
                5 meters ek account me. Ghar ke sab bills track karo, ek dashboard
                se.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
