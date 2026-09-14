import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self';",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com;",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
      "font-src 'self' https://fonts.gstatic.com data:;",
      "img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com;",
      `connect-src 'self' https://*.sentry.io https://res.cloudinary.com https://va.vercel-scripts.com ${isDev ? 'ws: wss: *' : ''};`,
      "frame-ancestors 'none';",
      "form-action 'self';",
      "base-uri 'self';",
    ].join(" "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.1.103',
    '192.168.1.103:3000',
    '10.56.155.221',
    '10.56.155.221:3000',
    '10.254.75.221',
    '10.101.73.221',
    'localhost',
    'localhost:3000',
    '127.0.0.1',
    '127.0.0.1:3000',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    if (isDev) {
      return []; // Do not restrict dev HMR and script loading in development
    }
    return [
      {
        // Apply security headers to all routes in production
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
