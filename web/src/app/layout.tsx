import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/components/AuthProvider";
import AuthModal from "@/components/AuthModal";

const BASE_URL = "https://guilt-attend-cabbage-state.2n6.me/billbachat";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "BillBachat — Bijli Bill Bachao | WhatsApp Slab Alert App Pakistan",
    template: "%s | BillBachat",
  },
  description:
    "Pakistan ki #1 electricity bill saving app. WhatsApp pe alert pao before 200 units cross ho. Slab tracker, bill prediction, bachat tips. Rs.99/month. FREE trial.",
  keywords: [
    "electricity bill Pakistan",
    "bijli bill bachao",
    "slab alert Pakistan",
    "LESCO bill save",
    "MEPCO bill calculator",
    "IESCO bill tracker",
    "K-Electric bill",
    "NEPRA slab system",
    "bill bachat app",
    "200 unit limit alert",
    "Pakistan electricity save",
    "WhatsApp bill alert",
  ],
  authors: [{ name: "BillBachat" }],
  creator: "BillBachat",
  publisher: "BillBachat",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: BASE_URL,
    siteName: "BillBachat",
    title: "BillBachat — Bijli Bill Bachao | WhatsApp Slab Alert",
    description:
      "WhatsApp pe alert pao before 200 unit limit cross ho. Slab tracker + bachat tips. Rs.99/month, FREE trial. 3 Crore Pakistani ghar ke liye.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BillBachat — Bijli ka bill bachao, WhatsApp slab alerts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BillBachat — Bijli Bill Bachao",
    description:
      "WhatsApp pe alert before 200 unit limit cross. Slab tracker + save tips. Rs.99/mo, FREE trial.",
    images: ["/og-image.png"],
  },
  category: "technology",
};

export const viewport = {
  themeColor: "#0d9f6e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "BillBachat",
    url: BASE_URL,
    description:
      "Pakistan ki electricity bill saving app. WhatsApp slab alerts, bill prediction, bachat tips.",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web, Android, iOS",
    offers: {
      "@type": "Offer",
      price: "99",
      priceCurrency: "PKR",
      description: "Per month, first month FREE",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1200",
    },
    inLanguage: ["en", "ur"],
    areaServed: {
      "@type": "Country",
      name: "Pakistan",
    },
  };

  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <meta name="theme-color" content="#0d9f6e" />
      </head>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
