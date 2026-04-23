const isProduction = process.env.NODE_ENV === "production";

function getOrigin(rawUrl) {
  if (!rawUrl) {
    return null;
  }

  try {
    return new URL(rawUrl).origin;
  } catch {
    return null;
  }
}

function buildContentSecurityPolicy() {
  const supabaseOrigin = getOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const directives = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(isProduction ? [] : ["'unsafe-eval'"]),
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://region1.google-analytics.com",
      "https://www.clarity.ms",
      "https://scripts.clarity.ms",
      "https://*.clarity.ms",
      "https://tagmanager.google.com"
    ],
    "script-src-attr": ["'none'"],
    "style-src": [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://tagmanager.google.com"
    ],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      supabaseOrigin,
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://region1.google-analytics.com",
      "https://stats.g.doubleclick.net",
      "https://www.clarity.ms",
      "https://c.clarity.ms",
      "https://scripts.clarity.ms",
      "https://*.clarity.ms",
      "https://ssl.gstatic.com",
      "https://www.gstatic.com",
      "https://tagmanager.google.com"
    ],
    "font-src": [
      "'self'",
      "data:",
      "https://fonts.gstatic.com",
      "https://www.gstatic.com"
    ],
    "connect-src": [
      "'self'",
      supabaseOrigin,
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://region1.google-analytics.com",
      "https://analytics.google.com",
      "https://stats.g.doubleclick.net",
      "https://www.clarity.ms",
      "https://c.clarity.ms",
      "https://*.clarity.ms",
      "https://tagmanager.google.com",
      ...(isProduction ? [] : ["ws:", "wss:"])
    ],
    "frame-src": [
      "'self'",
      "https://www.googletagmanager.com",
      "https://tagmanager.google.com"
    ],
    "manifest-src": ["'self'"],
    ...(isProduction ? { "upgrade-insecure-requests": [] } : {})
  };

  return Object.entries(directives)
    .map(([directive, values]) => {
      const sources = values.filter(Boolean);
      return sources.length > 0 ? `${directive} ${sources.join(" ")}` : directive;
    })
    .join("; ");
}

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy()
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=()"
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000"
        }
      ]
    : [])
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
