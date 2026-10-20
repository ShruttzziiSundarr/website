import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Keep the dev badge away from the HUD in the bottom left.
  devIndicators: { position: "bottom-right" },
  partialPrefetching: true,
  turbopack: {
    // Pin the root: an empty package-lock.json in the parent folder otherwise confuses detection.
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
