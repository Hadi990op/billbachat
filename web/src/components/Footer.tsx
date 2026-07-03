import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">⚡</span>
              <span className="text-xl font-extrabold text-white">
                Bill<span className="text-emerald-400">Bachat</span>
              </span>
            </div>
            <p className="text-sm">
              Pakistan ki #1 electricity bill saving app. WhatsApp slab alerts,
              bill prediction, save tips.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/check-bill/"
                  className="hover:text-emerald-400 transition"
                >
                  Check Bill
                </Link>
              </li>
              <li>
                <Link href="/demo/" className="hover:text-emerald-400 transition">
                  Live Demo
                </Link>
              </li>
              <li>
                <Link
                  href="/whatsapp/"
                  className="hover:text-emerald-400 transition"
                >
                  WhatsApp Alerts
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing/"
                  className="hover:text-emerald-400 transition"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">
              Supported DISCOs
            </h4>
            <p className="text-sm">
              LESCO · IESCO · MEPCO · FESCO · GEPCO · PESCO · HESCO · SEPCO ·
              QESCO · K-Electric
            </p>
          </div>
        </div>
        <div className="border-t border-stone-800 pt-6 text-center text-xs">
          <p>© 2026 BillBachat — Pakistan ke liye ❤️</p>
          <p className="mt-2">
            Not affiliated with any government entity. Data from PITC portal.
            NEPRA rates are public.
          </p>
        </div>
      </div>
    </footer>
  );
}
