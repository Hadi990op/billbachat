"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!showAuthModal) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (phone.replace(/\D/g, "").length < 10) {
      setError("Sahi phone number daalein (03XXXXXXXXX)");
      return;
    }

    setLoading(true);

    let result;
    if (mode === "signup") {
      if (name.trim().length < 2) {
        setError("Naam daalein (kam az kam 2 harf)");
        setLoading(false);
        return;
      }
      result = await signup(phone, name);
    } else {
      result = await login(phone);
    }

    setLoading(false);

    if (result.success) {
      setShowAuthModal(false);
      setPhone("");
      setName("");
      setError("");
    } else {
      setError(result.error || "Kuch galat hua. Try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
      onClick={() => setShowAuthModal(false)}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-extrabold text-stone-900">
            {mode === "signup" ? "🚀 Signup Karein" : "🔐 Login Karein"}
          </h3>
          <button
            onClick={() => setShowAuthModal(false)}
            className="text-stone-400 hover:text-stone-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-stone-500 mb-6">
          {mode === "signup"
            ? "Apna WhatsApp number daalein. Bill check, alerts, aur bachat — sab ek jagah."
            : "Apna phone number daalein. Account access karein."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">
                Naam
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Apna naam likhein"
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-emerald-500 outline-none transition text-stone-900 font-medium"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              WhatsApp Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="03XXXXXXXXX"
              maxLength={11}
              className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-emerald-500 outline-none transition text-stone-900 font-mono text-lg"
            />
            <p className="text-xs text-stone-400 mt-1">
              ⚡ Is number pe WhatsApp alerts aayenge
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {loading
              ? "Wait karein..."
              : mode === "signup"
              ? "Account Banao — FREE"
              : "Login Karo"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setError("");
            }}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {mode === "signup"
              ? "Pehle se account hai? Login karein"
              : "Naya account? Signup karein"}
          </button>
        </div>

        <p className="text-xs text-stone-400 text-center mt-4">
          🔒 No password needed. Phone number hi aapka account hai.
        </p>
      </div>
    </div>
  );
}
