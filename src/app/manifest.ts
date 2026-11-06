import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SchoolPulse – ogłoszenia szkolne", short_name: "SchoolPulse", description: "Ogłoszenia, wydarzenia i terminy szkolne.", lang: "pl",
    start_url: "/", scope: "/", display: "standalone", background_color: "#f8f9fc", theme_color: "#4f46e5",
    id: "/",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
