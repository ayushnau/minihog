import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  // Standalone mode: Next.js traces and copies ALL dependencies (including
  // next/dist/**) into .next/standalone/. In a monorepo where next is hoisted
  // to the repo root, the plugin's own nft tracer can't find it — standalone
  // bypasses that by letting Next.js bundle everything itself.
  output: 'standalone',
  // Tell Next.js's file tracer to look from the repo root so it finds
  // next/dist/** in ../../node_modules/ (npm workspaces hoisting).
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
};

export default nextConfig;
