/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Watch for changes in the SDK package
  webpack: (config, { isServer }) => {
    // Add the SDK source to webpack watch options
    if (!isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '!**/node_modules/minihog-sdk/**',
          '!**/node_modules/minihog-sdk/src/**',
        ],
      };
    }
    return config;
  },
};

module.exports = nextConfig;

