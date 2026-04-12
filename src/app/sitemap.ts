import type { MetadataRoute } from "next";
import { buildAbsoluteUrl } from "@/lib/seo";

const publicRoutes = ["/", "/pricing", "/simulate", "/privacy"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: buildAbsoluteUrl(route),
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.8
  }));
}
