import { composePlugins, withNx } from '@nx/next';

const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
};

export default composePlugins(withNx)(nextConfig);
