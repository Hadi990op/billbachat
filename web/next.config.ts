import type { NextConfig } from "next";

// On Vercel: no basePath, no trailingSlash (default Vercel settings)
// On our VM: basePath=/billbachat, trailingSlash=true (for Caddy proxy)
const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  ...(isVercel
    ? {} // Vercel: default settings work fine
    : { basePath: "/billbachat", assetPrefix: "/billbachat", trailingSlash: true }),
};

export default nextConfig;
