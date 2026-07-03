"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthProvider";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, loading, logout, setShowAuthModal } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/check-bill/", label: "Bill Check" },
    { href: "/demo/", label: "Demo" },
    { href: "/pricing/", label: "Pricing" },
  ];

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const planBadge =
    user?.effectivePlan === "pro"
      ? { text: "Pro", color: "bg-emerald-100 text-emerald-700" }
      : user?.effectivePlan === "family"
      ? { text: "Family", color: "bg-amber-100 text-amber-700" }
      : { text: "Free", color: "bg-stone-100 text-stone-600" };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
            onClick={() => setMenuOpen(false)}
          >
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-extrabold text-stone-900">
              Bill<span className="text-emerald-600">Bachat</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  pathname === link.href
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-stone-600 hover:text-emerald-600 hover:bg-stone-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA — Auth state */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-24 h-9 bg-stone-100 rounded-xl animate-pulse" />
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-50 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-stone-700 leading-tight">
                      {user.name.split(" ")[0]}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${planBadge.color}`}
                    >
                      {planBadge.text}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-stone-400 transition ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 animate-slideDown">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-sm font-semibold text-stone-800">
                        {user.name}
                      </p>
                      <p className="text-xs text-stone-500 font-mono">
                        {user.phone}
                      </p>
                    </div>
                    <Link
                      href="/account/"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition"
                    >
                      📊 My Account
                    </Link>
                    {user.effectivePlan === "free" && (
                      <Link
                        href="/pricing/"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition"
                      >
                        ⭐ Upgrade to Pro
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-sm font-medium text-stone-600 hover:text-emerald-600 px-3 py-2 rounded-lg transition"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20"
                >
                  FREE Signup
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2 -mr-2"
            aria-label="Menu"
          >
            <span
              className={`block w-6 h-0.5 bg-stone-800 transition-all ${
                menuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-stone-800 transition-all ${
                menuOpen ? "opacity-0" : ""
              }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-stone-800 transition-all ${
                menuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            ></span>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-stone-200 py-4 space-y-1 animate-slideDown">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition ${
                  pathname === link.href
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile auth section */}
            {loading ? null : user ? (
              <>
                <Link
                  href="/account/"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
                >
                  📊 My Account ({planBadge.text})
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  🚪 Logout ({user.name.split(" ")[0]})
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setShowAuthModal(true);
                  setMenuOpen(false);
                }}
                className="block mt-2 bg-emerald-600 text-white text-sm font-semibold px-4 py-3 rounded-xl text-center hover:bg-emerald-700 transition w-full"
              >
                ⚡ FREE Signup — Shuru Karo
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
