import SlabDemo from "@/components/SlabDemo";
import WhatsAppMockup from "@/components/WhatsAppMockup";

export const metadata = {
  title: "Live Demo — Slab Calculator & WhatsApp Alert",
  description:
    "Slider hila ke dekhein kaise 200 se 201 units pe bill double ho jata hai. WhatsApp alert demo bhi dekhein.",
};

export default function DemoPage() {
  return (
    <>
      {/* Slab Calculator Demo */}
      <section className="py-16 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
              Live Demo
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-3 mb-4">
              Slider hila ke dekhein
            </h1>
            <p className="text-lg text-stone-600">
              200 → 201 units pe jaate hi bill{" "}
              <span className="font-bold text-red-600">double</span> ho jata hai.
            </p>
          </div>
          <SlabDemo />
        </div>
      </section>

      {/* WhatsApp Alert Demo */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
              WhatsApp Alert Demo
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-3 mb-4">
              Aise alert aate hain
            </h2>
            <p className="text-lg text-stone-600">
              Slab cross hone se pehle BillBachat WhatsApp pe bata deta hai.
            </p>
          </div>
          <div className="flex justify-center">
            <WhatsAppMockup />
          </div>
        </div>
      </section>
    </>
  );
}
