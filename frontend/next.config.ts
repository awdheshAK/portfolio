import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product photos, garment layers and uploaded design assets are served
    // from the Laravel backend and/or Cloudinary at runtime, so the exact
    // hostname isn't known at build time. Cache Components / static export
    // are not used here, so this only affects the on-demand image optimizer.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
