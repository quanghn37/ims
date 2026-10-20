/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@ant-design/nextjs-registry'],
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons', 'dayjs'],
  },
};

module.exports = nextConfig;
