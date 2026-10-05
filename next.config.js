// APP_BUILD=1: Android (Capacitor) build - a WebView a gyökérből szolgál ki,
// ezért nincs basePath, és a service worker sem kell.
const isAppBuild = process.env.APP_BUILD === '1';
const basePath = isAppBuild ? '' : '/sorsfordito';

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' || isAppBuild,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

module.exports = withPWA(nextConfig);
