// APP_BUILD=1: Android (Capacitor) build - a WebView a gyökérből szolgál ki,
// ezért nincs basePath, és a service worker sem kell.
const isAppBuild = process.env.APP_BUILD === '1';
const basePath = isAppBuild ? '' : '/sorsfordito';

// Verziófelirat: a git commit rövid hashe és a build dátuma (így mindig látszik, melyik változat fut)
let buildId = 'helyi';
try {
  buildId = require('child_process').execSync('git rev-parse --short HEAD').toString().trim();
} catch {}
const buildDate = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

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
  env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_BUILD_ID: buildId, NEXT_PUBLIC_BUILD_DATE: buildDate },
};

module.exports = withPWA(nextConfig);
