import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Testy e2e używają osobnego katalogu (NEXT_DIST_DIR), aby nie kolidować z równolegle działającym `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
};

export default nextConfig;
