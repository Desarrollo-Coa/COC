import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  webpack(config) {
    config.plugins.push(new CaseSensitivePathsPlugin());
    return config;
  },
}

export default nextConfig
