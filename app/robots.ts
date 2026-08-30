import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://portfolio-adham-mu.vercel.app/sitemap.xml",
    host: "https://portfolio-adham-mu.vercel.app",
  };
}
