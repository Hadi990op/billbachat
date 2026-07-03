import type { NextConfig } from "next";

// On Vercel: no basePath (served at root)
// On our VM: basePath=/billbachat (served under /billbachat/ prefix)
const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  ...(isVercel ? {} : { basePath: "/billbachat", assetPrefix: "/billbachat" }),
  trailingSlash: true,
};

export default nextConfig;
