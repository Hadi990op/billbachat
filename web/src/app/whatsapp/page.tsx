import AlertsSetup from "@/components/AlertsSetup";

export const metadata = {
  title: "WhatsApp Alerts Setup — Slab Crossing Alerts",
  description:
    "Apna WhatsApp number connect karo. BillBachat jab 200 units se pehle pahunche tab WhatsApp pe alert bhejta hai. No spam, sirf bill alerts.",
};

export default function WhatsAppPage() {
  return (
    <section className="min-h-[80vh] bg-gradient-to-b from-emerald-50 to-white">
      <AlertsSetup />
    </section>
  );
}
