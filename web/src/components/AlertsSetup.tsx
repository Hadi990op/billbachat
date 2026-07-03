"use client";

import { useState, useEffect } from "react";

interface WaStatus {
  state: string;
  hasQr: boolean;
  qrImage: string | null;
  pairingCode: string | null;
  pairingPhone: string | null;
  botNumber: string | null;
  subscribers: number;
}

interface SavedBill {
  refNo: string;
  company: string;
  consumerName: string;
  unitsConsumed: number;
  payableWithinDueDate: number;
  dueDate: string;
  slabCategory: string;
  isProtected: boolean;
  checkedAt: string;
}

export default function AlertsSetup() {
  const [status, setStatus] = useState<WaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedBill, setSavedBill] = useState<SavedBill | null>(null);
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function fetchStatus() {
    try {
      const res = await fetch("/billbachat/wa/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load saved bill data from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("billbachat_lastBill");
      if (raw) setSavedBill(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  // Clean bot number: 923225490551:12@s.whatsapp.net -> 03225490551
  function cleanBotNumber(raw: string | null): string {
    if (!raw) return "";
    const clean = raw.split("@")[0].split(":")[0];
    // 923225490551 -> 03225490551
    if (clean.startsWith("92")) return "0" + clean.slice(2);
    return clean;
  }

  const isConnected = status?.state === "connected";
  const botNumber = cleanBotNumber(status?.botNumber || null);

  // User enters their OWN number, bot sends them a message on WhatsApp
  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || phone.length < 10) return;

    setSending(true);
    setResult(null);

    try {
      // If we have saved bill, use auto-subscribe (sends bill summary)
      if (savedBill) {
        const res = await fetch("/billbachat/wa/auto-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: phone,
            refNo: savedBill.refNo,
            company: savedBill.company,
            billData: {
              consumerName: savedBill.consumerName,
              unitsConsumed: savedBill.unitsConsumed,
              payableWithinDueDate: savedBill.payableWithinDueDate,
              dueDate: savedBill.dueDate,
              slabCategory: savedBill.slabCategory,
              isProtected: savedBill.isProtected,
              grandTotal: savedBill.payableWithinDueDate,
            },
          }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setResult("✅ WhatsApp pe message bhej diya! Check karo — notification aayegi.");
        } else {
          // Fallback: simple send
          await sendSimpleMessage();
        }
      } else {
        // No saved bill — send simple welcome message
        await sendSimpleMessage();
      }
    } catch {
      setResult("❌ Network error. Phir try karein.");
    } finally {
      setSending(false);
    }
  }

  async function sendSimpleMessage() {
    const res = await fetch("/billbachat/wa/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: phone,
        message:
          "✅ BillBachat me aapko welcome!\n\n" +
          "Ab aapko slab alerts milenge jab bill 200 units ke qareeb pohche.\n\n" +
          "Bill check karne ke liye:\nbill YOUR_REF_NO COMPANY\n\nExample: bill 06113530462901 lesco\n\n" +
          "Commands:\n• bill <refno> <company> — Bill check\n• subscribe <refno> <company> — Alerts\n• status — Subscription dekho\n• unsubscribe — Alerts band\n• help — Menu\n\n⚡ BillBachat — Bijli ka bill bachao!",
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setResult("✅ WhatsApp pe message bhej diya! Check karo.");
    } else {
      setResult("❌ " + (data.error || "Error. Phir try karein."));
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          WhatsApp Alerts
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mb-4">
          WhatsApp pe slab alerts pao
        </h1>
        <p className="text-lg text-stone-600">
          Apna WhatsApp number daalo — BillBachat bot aapko alert bhejega jab
          slab cross hone wala ho.
        </p>
      </div>

      {/* Bot not connected */}
      {!loading && !isConnected && (
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 text-center">
          <div className="text-5xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-red-700 mb-2">
            Bot abhi offline hai
          </h2>
          <p className="text-stone-600 text-sm">
            BillBachat bot connect nahi hai. Thodi der baad try karein, ya admin
            se contact karein.
          </p>
        </div>
      )}

      {/* Bot connected — simple flow */}
      {isConnected && (
        <div className="space-y-6">
          {/* Bot online banner */}
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
            <div>
              <p className="font-bold text-emerald-700 text-sm">
                Bot Online — {botNumber}
              </p>
              <p className="text-xs text-stone-500">
                BillBachat bot is number se aapko alerts bhejega
              </p>
            </div>
          </div>

          {/* Saved bill preview */}
          {savedBill && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-amber-700">
                  📋 Aapka pichla bill
                </p>
                <span className="text-xs text-stone-400">
                  {new Date(savedBill.checkedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="text-sm text-stone-700 space-y-1">
                {savedBill.consumerName && (
                  <p>👤 {savedBill.consumerName}</p>
                )}
                <p>
                  ⚡ {savedBill.unitsConsumed} units · Rs.{" "}
                  {savedBill.payableWithinDueDate.toLocaleString()} ·{" "}
                  {savedBill.company.toUpperCase()}
                </p>
                <p>
                  🏷️ Slab: {savedBill.slabCategory} ·{" "}
                  {savedBill.isProtected ? "✅ Protected" : "⚠️ Non-Protected"}
                </p>
              </div>
            </div>
          )}

          {/* Subscribe form — THE MAIN FLOW */}
          <div className="bg-white rounded-3xl shadow-xl border border-stone-200 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-stone-900 mb-2">
              📲 Apna WhatsApp number daalo
            </h3>
            <p className="text-sm text-stone-500 mb-4">
              Is number pe BillBachat bot alerts bhejega. WhatsApp pe notification
              aayegi.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3">
              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/[^\d]/g, ""))
                }
                placeholder="03XXXXXXXXX"
                maxLength={11}
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-emerald-500 outline-none transition text-stone-900 text-lg font-medium"
              />
              <button
                type="submit"
                disabled={sending || phone.length < 10}
                className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending
                  ? "⏳ Message bhej rahe hain..."
                  : "🔔 WhatsApp Alert On Karein →"}
              </button>
            </form>

            {/* Result */}
            {result && (
              <div
                className={`mt-4 rounded-xl p-4 text-center font-medium ${
                  result.startsWith("✅")
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {result}
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="bg-stone-100 rounded-2xl p-5">
            <h4 className="font-bold text-stone-900 text-sm mb-3">
              📋 Kaise kaam karta hai?
            </h4>
            <ol className="space-y-2 text-sm text-stone-600">
              <li className="flex gap-2">
                <span className="text-emerald-600 font-bold shrink-0">1.</span>
                Apna WhatsApp number upar daalo
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600 font-bold shrink-0">2.</span>
                Bot aapko WhatsApp pe confirmation message bhejega — check karo!
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600 font-bold shrink-0">3.</span>
                Bas! Ab jab slab cross hone wala ho, alert aa jayega
              </li>
            </ol>
          </div>

          {/* Alert examples */}
          <div className="bg-stone-100 rounded-2xl p-5">
            <h4 className="font-bold text-stone-900 text-sm mb-3">
              🔔 Aise alerts milenge:
            </h4>
            <ul className="space-y-2 text-sm text-stone-600">
              <li className="flex gap-2">
                <span>✅</span>
                &quot;Sirf 15 units baaki! AC band karo.&quot;
              </li>
              <li className="flex gap-2">
                <span>✅</span>
                &quot;Slab cross ho gaya — bill double ho raha hai.&quot;
              </li>
              <li className="flex gap-2">
                <span>✅</span>
                &quot;Due date 3 din baaki — Rs. 1,388 jama karo.&quot;
              </li>
            </ul>
            <p className="text-xs text-stone-400 mt-3">
              No spam. Sirf bill-related alerts. Cancel anytime —
              &quot;unsubscribe&quot; bhejein.
            </p>
          </div>

          {/* Bot commands help */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200">
            <h4 className="font-bold text-stone-900 text-sm mb-3">
              💬 WhatsApp pe bot ko ye commands bhejein:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="bg-stone-100 rounded-lg px-3 py-2 font-mono">
                <span className="text-emerald-600 font-bold">bill</span>{" "}
                &lt;refno&gt; &lt;company&gt;
              </div>
              <p className="text-xs text-stone-500 -mt-1">
                Example: bill 06113530462901 lesco
              </p>
              <div className="bg-stone-100 rounded-lg px-3 py-2 font-mono">
                <span className="text-emerald-600 font-bold">subscribe</span>{" "}
                &lt;refno&gt; &lt;company&gt;
              </div>
              <div className="bg-stone-100 rounded-lg px-3 py-2 font-mono">
                <span className="text-emerald-600 font-bold">status</span>{" "}
                — Subscription dekho
              </div>
              <div className="bg-stone-100 rounded-lg px-3 py-2 font-mono">
                <span className="text-emerald-600 font-bold">unsubscribe</span>{" "}
                — Alerts band
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-stone-500 mt-3 text-sm">Loading...</p>
        </div>
      )}
    </div>
  );
}
