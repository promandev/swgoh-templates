import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    // Portrait URLs are optional; the UI always falls back to initials.
    remotePatterns: [{ protocol: "https", hostname: "game-assets.swgoh.gg" }],
  },
};

export default withNextIntl(nextConfig);
