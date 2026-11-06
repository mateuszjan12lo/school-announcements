import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SchoolPulse – ogłoszenia szkolne", short_name: "SchoolPulse", description: "Ogłoszenia, wydarzenia i terminy szkolne.", lang: "pl",
    start_url: "/", scope: "/", display: "standalone", background_color: "#f8f9fc", theme_color: "#4f46e5",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }, { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
  };
}
