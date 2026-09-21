import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

const staticRoutes = [
  "",
  "/shop",
  "/customize",
  "/fabrics",
  "/collections",
  "/about",
  "/how-it-works",
  "/faq",
  "/contact",
  "/login",
  "/register",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return staticRoutes.map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
