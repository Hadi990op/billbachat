import type { NextConfig } from "next";

// On Vercel: no basePath, API requests proxied to VM
// On our VM: basePath=/billbachat (served under /billbachat/ prefix)
const isVercel = process.env.VERCEL === "1";

// VM API base — all API calls proxy here
const VM_API_BASE = "https://guilt-attend-cabbage-state.2n6.me/billbachat";

const nextConfig: NextConfig = {
  ...(isVercel
    ? {
        // Vercel: proxy all /api/* requests to our VM
        // VM handles auth (users.json), bill scraping (PITC), WhatsApp bot
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: `${VM_API_BASE}/api/:path*`,
            },
          ];
        },
      }
    : {
        // VM: serve under /billbachat/ prefix, no trailingSlash (fixes POST redirects)
        basePath: "/billbachat",
        assetPrefix: "/billbachat",
      }),
};

export default nextConfig;
