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

export default function WhatsAppAdmin() {
  const [status, setStatus] = useState<WaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendNumber, setSendNumber] = useState("");
  const [sendMessage, setSendMessage] = useState(
    "⚡ BillBachat test message — WhatsApp bot kaam kar raha hai!"
  );
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [sendLoading, setSendLoading] = useState(false);

  // Pairing code state
  const [pairPhone, setPairPhone] = useState("");
  const [pairLoading, setPairLoading] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);

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
    const interval = setInterval(fetchStatus, 5000); // auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSendLoading(true);
    setSendResult(null);

    try {
      // Remove spaces, dashes, + sign
      const cleanNumber = sendNumber.replace(/[^\d]/g, "");
      const res = await fetch("/billbachat/wa/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: cleanNumber, message: sendMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult(`✅ Message sent to ${cleanNumber}!`);
      } else {
        setSendResult(`❌ ${data.error || "Failed to send"}`);
      }
    } catch {
      setSendResult("❌ Network error");
    } finally {
      setSendLoading(false);
    }
  }

  async function handlePair(e: React.FormEvent) {
    e.preventDefault();
    if (!pairPhone) return;
    setPairLoading(true);
    setPairError(null);

    try {
      const res = await fetch("/billbachat/wa/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: pairPhone }),
      });
      const data = await res.json();
      if (data.success) {
        // Status will auto-refresh and show pairing code
        fetchStatus();
      } else {
        setPairError(data.error || "Failed to get pairing code");
      }
    } catch {
      setPairError("Network error");
    } finally {
      setPairLoading(false);
    }
  }

  async function handleLogout() {
    if (!confirm("Logout from WhatsApp? You'll need to scan QR again.")) return;
    try {
      await fetch("/billbachat/wa/logout", { method: "POST" });
      setStatus(null);
      setLoading(true);
      setTimeout(fetchStatus, 3000);
    } catch {
      // ignore
    }
  }

  const stateColors: Record<string, string> = {
    connected: "bg-emerald-100 text-emerald-700 border-emerald-300",
    connecting: "bg-amber-100 text-amber-700 border-amber-300",
    waiting_qr: "bg-blue-100 text-blue-700 border-blue-300",
    disconnected: "bg-red-100 text-red-700 border-red-300",
    logged_out: "bg-red-100 text-red-700 border-red-300",
  };

  const stateLabels: Record<string, string> = {
    connected: "✅ Connected",
    connecting: "🔄 Connecting...",
    waiting_qr: "📱 Waiting — QR or Pairing Code",
    disconnected: "❌ Disconnected",
    logged_out: "🚫 Logged Out",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
          WhatsApp Bot
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-3 mb-3">
          BillBachat WhatsApp Setup
        </h1>
        <p className="text-lg text-stone-600">
          Apne WhatsApp ko connect karein — Baileys (unofficial API) se, bina
          official Business API ke.
        </p>
      </div>

      {/* Status badge */}
      <div className="flex justify-center mb-6">
        <div
          className={`px-5 py-2.5 rounded-full border-2 font-semibold text-sm ${
            status
              ? stateColors[status.state] || "bg-stone-100 text-stone-600"
              : "bg-stone-100 text-stone-600"
          }`}
        >
          {status ? stateLabels[status.state] || status.state : "Loading..."}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT: QR Code / Connection */}
        <div className="bg-white rounded-3xl shadow-lg border border-stone-200 p-6">
          <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
            <span className="text-xl">📱</span> WhatsApp Connection
          </h3>

          {status?.state === "connected" ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">✅</div>
              <p className="font-bold text-emerald-600 text-lg mb-2">
                Bot Connected!
              </p>
              {status.botNumber && (
                <p className="text-sm text-stone-500">
                  Bot number: {status.botNumber}
                </p>
              )}
              <p className="text-sm text-stone-500 mt-2">
                Ab koi bhi WhatsApp number pe message bhej sakte hain.
              </p>
              <button
                onClick={handleLogout}
                className="mt-4 text-sm text-red-500 hover:text-red-700 font-medium"
              >
                Logout / Reconnect
              </button>
            </div>
          ) : status?.hasQr || status?.state === 'waiting_qr' || status?.state === 'connecting' ? (
            <div>
              {/* Pairing Code Section — BEST for same mobile */}
              <div className="bg-emerald-50 rounded-2xl p-4 border-2 border-emerald-200 mb-4">
                <h4 className="font-bold text-emerald-700 mb-2 flex items-center gap-2">
                  <span>🔢</span> Pairing Code (Number Se) — Recommended
                </h4>
                <p className="text-xs text-stone-600 mb-3">
                  QR scan nahi karna padega! Apna WhatsApp number daalo, ek code milega, wo WhatsApp me daalo.
                </p>

                {/* Show pairing code if available */}
                {status?.pairingCode ? (
                  <div className="text-center bg-white rounded-xl p-5 border-2 border-emerald-300 mb-3">
                    <p className="text-xs text-stone-500 mb-2">
                      👇 Ye code <strong>WhatsApp me daalo</strong> 👇
                    </p>
                    <p className="text-5xl font-extrabold tracking-[0.25em] text-emerald-600 font-mono mb-3 select-all">
                      {status.pairingCode}
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
                      <p className="text-xs text-amber-700 font-semibold">
                        ⏰ Ye code 60 seconds me expire ho jayega!
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Jaldi se WhatsApp me daalo. Agar expire ho gaya to naya code generate karo.
                      </p>
                    </div>
                    <div className="text-left bg-stone-50 rounded-lg p-3">
                      <p className="text-xs font-bold text-stone-700 mb-2">
                        📱 WhatsApp me karna kya hai:
                      </p>
                      <ol className="text-xs text-stone-600 space-y-1 list-decimal list-inside">
                        <li>WhatsApp app kholo</li>
                        <li>3 dots (⋮) → <strong>Settings</strong></li>
                        <li><strong>Linked Devices</strong> pe tap</li>
                        <li><strong>Link a Device</strong> pe tap</li>
                        <li>Niche <strong>"Link with phone number instead"</strong> pe tap</li>
                        <li>Ye code daalo: <strong className="text-emerald-600">{status.pairingCode}</strong></li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  /* Pairing form */
                  <form onSubmit={handlePair} className="space-y-2">
                    <input
                      type="tel"
                      value={pairPhone}
                      onChange={(e) => setPairPhone(e.target.value)}
                      placeholder="03XXXXXXXXX"
                      className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 outline-none transition text-stone-900 font-mono text-lg text-center"
                    />
                    <p className="text-xs text-stone-400 text-center">
                      Apna WhatsApp number daalo (jis number pe WhatsApp chal raha hai)
                    </p>
                    <button
                      type="submit"
                      disabled={pairLoading || !pairPhone}
                      className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pairLoading ? "Code generate ho raha hai..." : "🔢 Pairing Code Pao"}
                    </button>
                    {pairError && (
                      <div className="text-xs text-red-500 text-center bg-red-50 p-2 rounded-lg">
                        {pairError}
                      </div>
                    )}
                  </form>
                )}
              </div>

              {/* QR Code Section — fallback (dusra mobile se) */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                <h4 className="font-bold text-stone-600 mb-2 flex items-center gap-2 text-sm">
                  <span>📷</span> QR Code (dusre mobile se)
                </h4>
                <p className="text-xs text-stone-500 mb-3">
                  Agar dusra mobile hai to QR scan karo:
                </p>
                {status?.qrImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={status.qrImage}
                      alt="WhatsApp QR Code"
                      className="mx-auto rounded-xl border-2 border-stone-200"
                      width={200}
                      height={200}
                    />
                    <p className="text-xs text-stone-400 mt-2 text-center">
                      5 sec me auto-refresh
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-stone-400 text-center py-4">
                    QR generate ho raha hai...
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">⏳</div>
              <p className="text-stone-600">
                Connecting to WhatsApp... QR code generate ho raha hai.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Send Test Message */}
        <div className="bg-white rounded-3xl shadow-lg border border-stone-200 p-6">
          <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
            <span className="text-xl">📤</span> Test Message
          </h3>

          {status?.state !== "connected" ? (
            <div className="text-center py-8">
              <p className="text-stone-500 text-sm">
                Pehle WhatsApp connect karo, phir message bhej sakte hain.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={sendNumber}
                  onChange={(e) => setSendNumber(e.target.value)}
                  placeholder="923XXXXXXXXX"
                  className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-emerald-500 outline-none transition text-stone-900 font-mono"
                />
                <p className="text-xs text-stone-400 mt-1">
                  Country code ke saath, bina + ke. e.g. 923001234567
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">
                  Message
                </label>
                <textarea
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-emerald-500 outline-none transition text-stone-900 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sendLoading || !sendNumber}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendLoading ? "Sending..." : "📤 Send Message"}
              </button>

              {sendResult && (
                <div
                  className={`text-center p-3 rounded-xl text-sm font-medium ${
                    sendResult.startsWith("✅")
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {sendResult}
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Bot Commands Info */}
      <div className="mt-6 bg-stone-50 rounded-3xl border border-stone-200 p-6">
        <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
          <span className="text-xl">💬</span> Bot Commands
        </h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-white rounded-xl p-3 border border-stone-200">
            <code className="text-emerald-600 font-bold">help</code>
            <p className="text-stone-600 mt-1">Commands menu dekhein</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-stone-200">
            <code className="text-emerald-600 font-bold">
              bill 06113530462901 lesco
            </code>
            <p className="text-stone-600 mt-1">Bill check karein</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-stone-200">
            <code className="text-emerald-600 font-bold">
              subscribe 06113530462901 lesco
            </code>
            <p className="text-stone-600 mt-1">Daily alerts pao</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-stone-200">
            <code className="text-emerald-600 font-bold">status</code>
            <p className="text-stone-600 mt-1">Subscription dekhein</p>
          </div>
        </div>

        {/* Stats */}
        {status && (
          <div className="mt-4 flex gap-4">
            <div className="bg-emerald-50 rounded-xl px-4 py-2 text-center flex-1">
              <p className="text-2xl font-extrabold text-emerald-600">
                {status.subscribers}
              </p>
              <p className="text-xs text-stone-500">Subscribers</p>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-4 text-center text-xs text-stone-400 max-w-2xl mx-auto">
        <p>
          ⚠️ Ye unofficial WhatsApp Web API (Baileys) use karta hai — official
          WhatsApp Business API nahi. Apni zimmedari se use karein. Spam/bulk
          messaging mat karein.
        </p>
      </div>
    </div>
  );
}
