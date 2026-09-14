import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs/config';

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.sentry.io https://*.ingest.sentry.io wss:",
  "media-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join('; ');

const enforcedContentSecurityPolicy = [
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: enforcedContentSecurityPolicy,
  },
  {
    key: 'Content-Security-Policy-Report-Only',
    value: contentSecurityPolicy,
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), geolocation=(), microphone=(self)',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Next.js dev assets and HMR default to the hostname used to start the
  // server (`localhost`). Local mobile/device checks also use the loopback IP.
  allowedDevOrigins: ['127.0.0.1'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

const sentryConfig = {
  org: 'solo-qu',
  project: 'tempotune',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
};

export default process.env.NODE_ENV === 'development'
  ? nextConfig
  : withSentryConfig(nextConfig, sentryConfig);
