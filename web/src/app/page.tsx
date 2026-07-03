import WhatsAppMockup from "@/components/WhatsAppMockup";
import Link from "next/link";

export const metadata = {
  title: "Bijli Bill Bachao — WhatsApp Slab Alert App",
  description:
    "Apna bijli bill aadha kar dein. 200 units cross karte hi bill double. BillBachat WhatsApp pe pehle bata deta hai. Rs.99/mo, FREE trial.",
};

export default function Home() {
  return (
    <>
      {/* ============ HERO SECTION ============ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-stone-50 to-stone-50 pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                1st Month FREE — No card needed
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 leading-tight mb-6">
                Apna bijli bill <span className="gradient-text">aadha</span> kar
                dein
              </h1>
              <p className="text-lg sm:text-xl text-stone-600 mb-8 max-w-xl mx-auto lg:mx-0">
                200 units cross karte hi bill{" "}
                <span className="font-bold text-red-600">double</span> ho jata
                hai. BillBachat WhatsApp pe pehle bata deta hai —{" "}
                <span className="font-semibold text-stone-800">
                  bachein Rs. 3,000+ har mahina.
                </span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/check-bill/"
                  className="bg-emerald-600 text-white text-lg font-bold px-8 py-4 rounded-2xl hover:bg-emerald-700 transition shadow-xl shadow-emerald-600/25 text-center"
                >
                  ⚡ Bill Check Karein →
                </Link>
                <Link
                  href="/demo/"
                  className="bg-white text-stone-700 text-lg font-semibold px-8 py-4 rounded-2xl border-2 border-stone-200 hover:border-emerald-400 transition text-center"
                >
                  Demo Dekhein
                </Link>
              </div>
              {/* Trust signals */}
              <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start">
                <div>
                  <p className="text-2xl font-extrabold text-stone-900">
                    3 Cr+
                  </p>
                  <p className="text-sm text-stone-500">ghar phanse hain</p>
                </div>
                <div className="w-px h-10 bg-stone-300"></div>
                <div>
                  <p className="text-2xl font-extrabold text-stone-900">
                    Rs. 99
                  </p>
                  <p className="text-sm text-stone-500">/month only</p>
                </div>
                <div className="w-px h-10 bg-stone-300"></div>
                <div>
                  <p className="text-2xl font-extrabold text-stone-900">⚡</p>
                  <p className="text-sm text-stone-500">WhatsApp alerts</p>
                </div>
              </div>
            </div>

            {/* Right: WhatsApp mockup */}
            <div className="flex justify-center lg:justify-end">
              <WhatsAppMockup />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent"></div>
      </section>

      {/* ============ PITCH / PROBLEM SECTION ============ */}
      <section id="problem" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
              Pakistan ka Slab Trap
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-3 mb-4">
              1 unit zyada = bill <span className="text-red-600">double</span>
            </h2>
            <p className="text-lg text-stone-600">
              200 units pe rate Rs. 10. 201 pe Rs. 15. Bas itna sa farq — aur
              hazaron rupya extra.
            </p>
          </div>

          {/* Problem cards */}
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            <div className="bg-red-50 rounded-3xl p-6 border border-red-100">
              <div className="text-4xl mb-3">😱</div>
              <h3 className="font-bold text-stone-900 mb-2">Bill Double</h3>
              <p className="text-sm text-stone-600">
                Pichla bill Rs. 4,000. Is baar Rs. 9,000? 1 unit zyada — poora
                rate badal gaya.
              </p>
            </div>
            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
              <div className="text-4xl mb-3">🤷</div>
              <h3 className="font-bold text-stone-900 mb-2">Samajh Nahi Aata</h3>
              <p className="text-sm text-stone-600">
                Slab, FPA, taxes, protected consumer — bill me 20 cheezein, koi
                samajh nahi aata.
              </p>
            </div>
            <div className="bg-stone-100 rounded-3xl p-6 border border-stone-200">
              <div className="text-4xl mb-3">📵</div>
              <h3 className="font-bold text-stone-900 mb-2">
                Pata Baad Me Chalta
              </h3>
              <p className="text-sm text-stone-600">
                Bill aane tak sab khatam. Agar pehle pata hota to AC band kar
                dete — Rs. 3,000 bach jate.
              </p>
            </div>
          </div>

          {/* The Slab Trap explained */}
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-6 text-center">
              ⚡ Pakistan Electricity Slab Rates 2026
            </h3>
            <div className="space-y-3 mb-6">
              {[
                {
                  range: "1-100 units",
                  rate: "Rs. 7.74/unit",
                  color: "bg-emerald-500",
                  label: "Sasta",
                  width: "40%",
                },
                {
                  range: "101-200 units",
                  rate: "Rs. 10.25/unit",
                  color: "bg-emerald-500",
                  label: "Protected ✅",
                  width: "60%",
                },
                {
                  range: "201-300 units",
                  rate: "Rs. 14.65/unit",
                  color: "bg-amber-500",
                  label: "Mehenga ⚠️",
                  width: "80%",
                },
                {
                  range: "301-400 units",
                  rate: "Rs. 16.42/unit",
                  color: "bg-red-500",
                  label: "Bohat Mehenga 🔴",
                  width: "95%",
                },
                {
                  range: "401+ units",
                  rate: "Rs. 20.50+/unit",
                  color: "bg-red-700",
                  label: "Khatarnaak ☠️",
                  width: "100%",
                },
              ].map((slab) => (
                <div key={slab.range} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium text-stone-300 shrink-0">
                    {slab.range}
                  </div>
                  <div className="flex-1 bg-stone-700 rounded-full h-8 overflow-hidden">
                    <div
                      className={`${slab.color} h-full rounded-full flex items-center justify-end pr-3 transition-all`}
                      style={{ width: slab.width }}
                    >
                      <span className="text-xs font-bold text-white whitespace-nowrap">
                        {slab.label}
                      </span>
                    </div>
                  </div>
                  <div className="w-28 text-sm font-mono text-stone-300 text-right shrink-0">
                    {slab.rate}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 text-center">
              <p className="text-lg font-bold text-red-300">
                ⚠️ 200 → 201: 1 unit zyada = poora bill double
              </p>
              <p className="text-sm text-stone-300 mt-1">
                Is &quot;Slab Cliff&quot; se 3 Crore Pakistani ghar phanse hain.
              </p>
            </div>
          </div>

          {/* CTA to demo */}
          <div className="text-center mt-8">
            <Link
              href="/demo/"
              className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 transition"
            >
              Slider hila ke dekhein kaise bill double hota hai →
            </Link>
          </div>
        </div>
      </section>

      {/* ============ SOLUTION SECTION ============ */}
      <section id="solution" className="py-20 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
              Solution
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-3 mb-4">
              WhatsApp pe alert — pehle hi bata deta hai
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              No hardware. No smart meter. Sirf app + WhatsApp. 200 unit se
              pehle bata deta hai, tabhi bacha deta hai.
            </p>
          </div>

          {/* 3-step solution */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-stone-100 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <div className="text-emerald-600 font-bold text-sm mb-2">
                STEP 1
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">
                Bill Jorrein
              </h3>
              <p className="text-stone-600 text-sm">
                Company select karo (LESCO, MEPCO, etc.) + 14-digit ref number.
                Bas. Baqi sab automatic.
              </p>
              <Link
                href="/check-bill/"
                className="inline-block mt-3 text-emerald-600 text-sm font-semibold hover:text-emerald-700"
              >
                Abhi try karein →
              </Link>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg border border-stone-100 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔔</span>
              </div>
              <div className="text-amber-600 font-bold text-sm mb-2">
                STEP 2
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">
                Alert Pao
              </h3>
              <p className="text-stone-600 text-sm">
                WhatsApp pe: &quot;Sirf 5 units baaki! AC band karo, bill double
                hone se bachao!&quot;
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg border border-stone-100 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <div className="text-emerald-600 font-bold text-sm mb-2">
                STEP 3
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Bachao</h3>
              <p className="text-stone-600 text-sm">
                Tips follow karo. Har mahine Rs. 2,000-5,000 bachao. App batata
                hai: &quot;Rs. 3,200 bachaye!&quot;
              </p>
            </div>
          </div>

          {/* Feature grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: "⚡",
                title: "Unit Tracker",
                desc: "Kitne units use kiye, kitni limit baaki — live",
              },
              {
                icon: "🔔",
                title: "Slab Alert",
                desc: "WhatsApp pe bata deta hai 200 se pehle",
              },
              {
                icon: "📊",
                title: "Bill Prediction",
                desc: "Mahine ke end tak kitna bill aayega",
              },
              {
                icon: "💡",
                title: "Save Tips",
                desc: "AC, geyser, iron — kya band karo, kitna bachega",
              },
              {
                icon: "📈",
                title: "History",
                desc: "6 mahine ki units, trend, margin",
              },
              {
                icon: "📅",
                title: "Due Date Alert",
                desc: "Late fee se bachao, time pe remind",
              },
              {
                icon: "🎯",
                title: "Safe Zone",
                desc: "Protected category me rehne me madad",
              },
              {
                icon: "📱",
                title: "No Hardware",
                desc: "Sirf app + WhatsApp. Smart meter nahi chahiye",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-5 border border-stone-100 hover:shadow-md transition"
              >
                <div className="text-2xl mb-2">{f.icon}</div>
                <h4 className="font-bold text-stone-900 text-sm mb-1">
                  {f.title}
                </h4>
                <p className="text-xs text-stone-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SOCIAL PROOF / STATS ============ */}
      <section className="py-16 bg-stone-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-extrabold text-emerald-400">3 Cr+</p>
              <p className="text-sm text-stone-400 mt-1">ghar slab trap me</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-emerald-400">86%</p>
              <p className="text-sm text-stone-400 mt-1">
                ≤200 units (protected)
              </p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-emerald-400">
                Rs. 3,000+
              </p>
              <p className="text-sm text-stone-400 mt-1">monthly bachat</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-emerald-400">Rs. 99</p>
              <p className="text-sm text-stone-400 mt-1">/month cost</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-6">
            Aaj se bill pe control
          </h2>
          <p className="text-lg sm:text-xl text-emerald-100 mb-8">
            3 Crore ghar phanse hain. Aap smart bano — pehle pao, pehle bachao.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/check-bill/"
              className="bg-white text-emerald-700 text-lg font-bold px-10 py-4 rounded-2xl hover:bg-emerald-50 transition shadow-xl text-center"
            >
              ⚡ Bill Check Karein
            </Link>
            <Link
              href="/pricing/"
              className="bg-emerald-700/50 text-white text-lg font-semibold px-10 py-4 rounded-2xl border-2 border-emerald-400/50 hover:bg-emerald-700 transition text-center"
            >
              📲 FREE Trial
            </Link>
          </div>
          <p className="text-sm text-emerald-200 mt-6">
            No credit card · JazzCash/Easypaisa · Cancel anytime
          </p>
        </div>
      </section>
    </>
  );
}
