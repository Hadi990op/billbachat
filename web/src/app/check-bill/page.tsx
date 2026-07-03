import BillLookup from "@/components/BillLookup";

export const metadata = {
  title: "Check Your Electricity Bill — Live PITC Data",
  description:
    "Apna asli bijli bill check karein. Reference number daalo — units, amount, slab status, consumer name, sab kuch live PITC portal se.",
};

export default function CheckBillPage() {
  return (
    <section className="py-16 bg-gradient-to-b from-emerald-50 to-white min-h-[80vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
            Live Bill Check
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-3 mb-4">
            Apna asli bill check karein
          </h1>
          <p className="text-lg text-stone-600">
            Reference number daalo — naam, units, amount, slab status, sab kuch
            aajaye.
          </p>
        </div>
        <BillLookup />

        {/* Helper section */}
        <div className="mt-8 bg-stone-100 rounded-2xl p-6">
          <h3 className="font-bold text-stone-900 mb-3">
            📍 Reference number kahan milega?
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-stone-600">
            <div>
              <p className="font-semibold text-stone-800 mb-1">
                Bill pe (physical):
              </p>
              <p>Upar right corner me 14-digit number likha hota hai</p>
            </div>
            <div>
              <p className="font-semibold text-stone-800 mb-1">
                SMS se:
              </p>
              <p>Apne DISCO ko SMS karo — bill info aa jayegi</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
