import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          // ↑ Stops hackers from embedding your site inside their fake site

          { key: "X-Content-Type-Options", value: "nosniff" },
          // ↑ Stops browser from guessing file types (security risk)

          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // ↑ Controls what info is sent when user clicks external links

          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // ↑ Blocks your site from accessing camera/mic/location (you don't need them)
        ],
      },
    ];
  },
};

export default nextConfig;