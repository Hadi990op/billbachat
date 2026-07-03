import type { MetadataRoute } from "next";

const BASE_URL = "https://guilt-attend-cabbage-state.2n6.me/billbachat";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/_next/", "/api/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: "guilt-attend-cabbage-state.2n6.me",
  };
}
