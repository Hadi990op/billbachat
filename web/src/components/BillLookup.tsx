"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

const DISCOS = [
  { code: "lesco", name: "LESCO", fullName: "Lahore Electric Supply Company" },
  { code: "iesco", name: "IESCO", fullName: "Islamabad Electric Supply Company" },
  { code: "mepco", name: "MEPCO", fullName: "Multan Electric Power Company" },
  { code: "fesco", name: "FESCO", fullName: "Faisalabad Electric Supply Company" },
  { code: "gepco", name: "GEPCO", fullName: "Gujranwala Electric Power Company" },
  { code: "pesco", name: "PESCO", fullName: "Peshawar Electric Supply Company" },
  { code: "hesco", name: "HESCO", fullName: "Hyderabad Electric Supply Company" },
  { code: "sepco", name: "SEPCO", fullName: "Sukkur Electric Supply Company" },
  { code: "qesco", name: "QESCO", fullName: "Quetta Electric Supply Company" },
];

interface BillData {
  success: boolean;
  company?: string;
  referenceNumber?: string;
  consumerId?: string;
  consumerName?: string;
  address?: string;
  previousReading?: string;
  presentReading?: string;
  unitsConsumed?: number;
  dueDate?: string;
  totalElectricityCharges?: number;
  subsidies?: number;
  currentBill?: number;
  grandTotal?: number;
  payableWithinDueDate?: number;
  slabCategory?: string;
  isProtected?: boolean;
  error?: string;
  _meta?: { plan: string; remaining: number; loggedIn: boolean };
}

export default function BillLookup() {
  const [refNo, setRefNo] = useState("");
  const [company, setCompany] = useState("lesco");
  const [loading, setLoading] = useState(false);
  const [bill, setBill] = useState<BillData | null>(null);
  const [limitHit, setLimitHit] = useState(false);
  const { user, token, setShowAuthModal } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!refNo || refNo.length < 10) return;

    // If not logged in, show auth modal
    if (!user && !token) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    setBill(null);
    setLimitHit(false);

    try {
      const res = await fetch(
        `/billbachat/api/check-bill/?ref=${refNo}&company=${company}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const data = await res.json();

      // Check if limit reached
      if (data.error === "limit_reached") {
        setLimitHit(true);
        setLoading(false);
        return;
      }

      setBill(data);

      // Save bill data to localStorage for auto-subscribe on WhatsApp connect
      if (data.success) {
        localStorage.setItem(
          "billbachat_lastBill",
          JSON.stringify({
            refNo,
            company,
            consumerName: data.consumerName || "",
            unitsConsumed: data.unitsConsumed || 0,
            payableWithinDueDate: data.payableWithinDueDate || data.grandTotal || 0,
            dueDate: data.dueDate || "",
            slabCategory: data.slabCategory || "",
            isProtected: data.isProtected || false,
            checkedAt: new Date().toISOString(),
          })
        );
      }
    } catch {
      setBill({ success: false, error: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  }

  const remaining = bill?._meta?.remaining;
  const showRemaining =
    user?.effectivePlan === "free" && remaining !== undefined && remaining >= 0;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-stone-200 p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-extrabold text-stone-900 mb-1">
          Apna Bill Check Karein
        </h3>
        <p className="text-stone-500 text-sm">
          Reference number daalo — asli bill data aajaye
        </p>
      </div>

      {/* Free tier remaining indicator */}
      {showRemaining && (
        <div className="mb-4 bg-stone-50 rounded-xl p-3 text-center">
          <p className="text-xs text-stone-500">
            🆓 Free plan:{" "}
            <span className="font-bold text-stone-700">
              {remaining === 0 ? "0" : remaining} / 1
            </span>{" "}
            checks baaj aaj
            {remaining === 0 && (
              <span className="text-red-500 font-semibold">
                {" "}
                — Limit khatam! Pro lein for unlimited.
              </span>
            )}
          </p>
        </div>
      )}

      {/* Limit hit banner */}
      {limitHit && (
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-red-50 border-2 border-amber-200 rounded-2xl p-5 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <h4 className="text-lg font-bold text-stone-800 mb-1">
            Free limit khatam ho gaya!
          </h4>
          <p className="text-sm text-stone-600 mb-4">
            Aaj 1 bill check ho chuka. Pro me{" "}
            <strong>unlimited bill checks</strong> + WhatsApp alerts milte hain.
          </p>
          <Link
            href="/pricing/"
            className="inline-flex bg-emerald-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-emerald-700 transition shadow-lg"
          >
            ⭐ Pro lein — Rs. 99/month
          </Link>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1">
            Electric Company
          </label>
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-emerald-500 outline-none transition text-stone-900 font-medium"
          >
            {DISCOS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name} — {d.fullName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1">
            Reference Number
          </label>
          <input
            type="text"
            value={refNo}
            onChange={(e) => setRefNo(e.target.value.replace(/\D/g, ""))}
            placeholder="e.g. 06113530462901"
            maxLength={14}
            className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-emerald-500 outline-none transition text-stone-900 font-mono text-lg"
          />
          <p className="text-xs text-stone-400 mt-1">
            Bill pe 14-digit number likha hota hai
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || refNo.length < 10}
          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Bill aa raha hai...
            </span>
          ) : !user ? (
            "Login karke check karein →"
          ) : (
            "Bill Check Karo"
          )}
        </button>
      </form>

      {/* Bill Results */}
      {bill && bill.success && (
        <div className="space-y-4 animate-fadeIn">
          {/* Slab status banner */}
          <div
            className={`rounded-2xl p-4 ${
              bill.isProtected
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Slab Status
                </p>
                <p
                  className={`text-lg font-bold ${
                    bill.isProtected ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {bill.slabCategory}
                </p>
              </div>
              <div
                className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                  bill.isProtected
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {bill.isProtected ? "✅ Protected" : "⚠️ Not Protected"}
              </div>
            </div>
          </div>

          {/* Consumer info */}
          <div className="bg-stone-50 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
              Consumer
            </p>
            <p className="font-bold text-stone-800 text-sm">{bill.consumerName}</p>
            <p className="text-stone-500 text-xs mt-1">{bill.address}</p>
          </div>

          {/* Bill summary grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-xs text-stone-500 font-semibold">Units</p>
              <p className="text-xl font-bold text-stone-800">
                {bill.unitsConsumed}
              </p>
            </div>
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-xs text-stone-500 font-semibold">Bill Amount</p>
              <p className="text-xl font-bold text-stone-800">
                Rs. {bill.payableWithinDueDate?.toLocaleString()}
              </p>
            </div>
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-xs text-stone-500 font-semibold">Due Date</p>
              <p className="text-sm font-bold text-stone-800">{bill.dueDate}</p>
            </div>
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-xs text-stone-500 font-semibold">Reading</p>
              <p className="text-sm font-bold text-stone-800 font-mono">
                {bill.previousReading} → {bill.presentReading}
              </p>
            </div>
          </div>

          {/* Pro upsell for free users */}
          {user?.effectivePlan === "free" && (
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-4 text-white text-center">
              <p className="font-bold text-sm mb-1">
                ⚡ WhatsApp Alert on karein — sirf Rs. 99/month
              </p>
              <p className="text-xs text-emerald-50 mb-3">
                Daily slab check + warning before 200 units cross
              </p>
              <Link
                href="/pricing/"
                className="inline-flex bg-white text-emerald-700 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition"
              >
                Pro lein →
              </Link>
            </div>
          )}

          {/* Alert setup CTA for Pro users */}
          {user?.effectivePlan !== "free" && (
            <Link
              href="/whatsapp/"
              className="block bg-emerald-600 text-white text-center font-bold py-3 rounded-xl hover:bg-emerald-700 transition"
            >
              📲 WhatsApp Alert Setup
            </Link>
          )}
        </div>
      )}

      {/* Error */}
      {bill && !bill.success && !limitHit && (
        <div className="bg-red-50 rounded-2xl p-4 text-center">
          <p className="text-red-600 font-semibold text-sm">
            ❌ {bill.error || "Bill nahi mila. Reference number check karein."}
          </p>
        </div>
      )}
    </div>
  );
}
