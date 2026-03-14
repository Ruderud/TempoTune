import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  /* config options here */
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
