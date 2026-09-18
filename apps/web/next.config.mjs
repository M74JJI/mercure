/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: [
    '@mercure/platform-frontend-api-client',
    '@mercure/platform-frontend-design-system',
    '@mercure/platform-frontend-navigation',
    '@mercure/platform-frontend-shell',
  ],
};

export default nextConfig;
