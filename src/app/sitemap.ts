import type { MetadataRoute } from "next";
import { buildAbsoluteUrl } from "@/lib/seo";
import { seoRoles } from "@/lib/seo-roles";

const publicRoutes = ["/", "/pricing", "/hire/new", "/privacy", "/terms", ...seoRoles.map((role) => `/roles/${role.slug}`)];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: buildAbsoluteUrl(route),
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.8
  }));
}
