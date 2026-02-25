import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Security headers ──────────────────────────────────────────────
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        // Prevent MIME-type sniffing
        { key: "X-Content-Type-Options", value: "nosniff" },
        // Prevent Click-jacking – allow only same-origin framing
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        // Strict referrer for privacy
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // Opt-out of Google FLoC / Topics
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        // Strict Transport Security — enforce HTTPS for 1 year
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        // Basic CSP — allow self + inline styles (needed for Tailwind) + Google fonts
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https:",
            "connect-src 'self' https: wss:",
            "frame-ancestors 'self'",
          ].join("; "),
        },
      ],
    },
  ],

  // ── Powered-by header removal ─────────────────────────────────────
  poweredByHeader: false,
};

export default nextConfig;
