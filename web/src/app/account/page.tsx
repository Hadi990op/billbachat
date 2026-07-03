"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function AccountPage() {
  const { user, loading, token, refresh, setShowAuthModal } = useAuth();
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState("");

  // Demo upgrade (for testing — will be replaced by payment verification)
  async function demoUpgrade(plan: "pro" | "family") {
    setUpgrading(true);
    setUpgradeMsg("");
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
        setUpgradeMsg(`✅ ${plan} plan activate ho gaya!`);
      } else {
        setUpgradeMsg(`❌ ${data.error || "Upgrade failed"}`);
      }
    } catch {
      setUpgradeMsg("❌ Network error");
    } finally {
      setUpgrading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-stone-800 mb-2">
          Login karein pehle
        </h2>
        <p className="text-stone-500 mb-6">
          Apna account dekhne ke liye login karein
        </p>
        <button
          onClick={() => setShowAuthModal(true)}
          className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-700 transition"
        >
          Login / Signup
        </button>
      </div>
    );
  }

  const planColors = {
    free: { bg: "bg-stone-100", text: "text-stone-700", label: "Free" },
    pro: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Pro" },
    family: { bg: "bg-amber-100", text: "text-amber-700", label: "Family" },
  };

  const plan = user.effectivePlan;
  const colors = planColors[plan];

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-emerald-50 to-white py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center text-3xl font-bold mx-auto mb-4">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900">
            {user.name}
          </h1>
          <p className="text-stone-500 font-mono mt-1">{user.phone}</p>
          <div
            className={`inline-block mt-3 px-4 py-1.5 rounded-full text-sm font-bold ${colors.bg} ${colors.text}`}
          >
            ⭐ {colors.label} Plan
          </div>
        </div>

        {upgradeMsg && (
          <div className="mb-6 bg-white rounded-2xl border border-stone-200 p-4 text-center text-sm font-medium text-stone-700">
            {upgradeMsg}
          </div>
        )}

        {/* Plan status card */}
        <div className="bg-white rounded-3xl shadow-xl border border-stone-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-stone-800 mb-4">
            📊 Current Plan
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-stone-50 rounded-xl p-4">
              <p className="text-xs text-stone-500 font-semibold mb-1">
                Plan
              </p>
              <p className={`text-xl font-bold ${colors.text}`}>
                {colors.label}
              </p>
            </div>
            <div className="bg-stone-50 rounded-xl p-4">
              <p className="text-xs text-stone-500 font-semibold mb-1">
                Expiry
              </p>
              <p className="text-sm font-bold text-stone-800">
                {user.planExpiry
                  ? new Date(user.planExpiry).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>

          {plan === "free" && (
            <div className="mt-4 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-5 text-white">
              <p className="font-bold mb-1">⭐ Upgrade to Pro</p>
              <p className="text-sm text-emerald-50 mb-3">
                Unlimited bill checks + WhatsApp daily alerts + slab warnings
              </p>
              <Link
                href="/pricing/"
                className="inline-flex bg-white text-emerald-700 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition"
              >
                Pro lein — Rs. 99/month →
              </Link>
            </div>
          )}
        </div>

        {/* Usage stats */}
        <div className="bg-white rounded-3xl shadow-xl border border-stone-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-stone-800 mb-4">
            📈 Usage Today
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between bg-stone-50 rounded-xl p-4">
              <span className="text-sm text-stone-600">Bill Checks Today</span>
              <span className="font-bold text-stone-800">
                {user.billChecksToday}
                {plan === "free" && (
                  <span className="text-stone-400 text-sm"> / 1</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between bg-stone-50 rounded-xl p-4">
              <span className="text-sm text-stone-600">Saved Bills</span>
              <span className="font-bold text-stone-800">
                {user.refNos.length}
              </span>
            </div>

            <div className="flex items-center justify-between bg-stone-50 rounded-xl p-4">
              <span className="text-sm text-stone-600">Member Since</span>
              <span className="font-bold text-stone-800 text-sm">
                {new Date(user.createdAt).toLocaleDateString("en-PK", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Saved bills */}
        {user.refNos.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl border border-stone-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-stone-800 mb-4">
              💾 Saved Bills
            </h2>
            <div className="space-y-2">
              {user.refNos.map((ref, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-stone-50 rounded-xl p-3"
                >
                  <div>
                    <p className="font-mono text-sm font-bold text-stone-800">
                      {ref.refNo}
                    </p>
                    <p className="text-xs text-stone-500 uppercase">
                      {ref.company}
                    </p>
                  </div>
                  <Link
                    href={`/check-bill/?ref=${ref.refNo}&company=${ref.company}`}
                    className="text-emerald-600 text-sm font-medium hover:text-emerald-700"
                  >
                    Check →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demo upgrade (REMOVE when payment flow is live) */}
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
          <h2 className="text-sm font-bold text-amber-800 mb-2">
            🧪 Demo: Quick Upgrade (testing only)
          </h2>
          <p className="text-xs text-amber-700 mb-3">
            Ye sirf testing ke liye hai. Real me payment verification se plan
            upgrade hoga.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => demoUpgrade("pro")}
              disabled={upgrading}
              className="flex-1 bg-emerald-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-emerald-700 transition disabled:opacity-50"
            >
              Pro (1 month)
            </button>
            <button
              onClick={() => demoUpgrade("family")}
              disabled={upgrading}
              className="flex-1 bg-amber-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-amber-700 transition disabled:opacity-50"
            >
              Family (1 month)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
