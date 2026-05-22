import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  // In npm workspaces, Next.js is hoisted to the repo root node_modules/.
  // This tells @vercel/nft (used by @netlify/plugin-nextjs) to trace files
  // from the monorepo root so it can find next/dist/** at runtime.
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
};

export default nextConfig;
