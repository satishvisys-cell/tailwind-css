/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  transpilePackages: ['@recruitmail/db', '@recruitmail/queue', '@recruitmail/extraction'],
};

export default nextConfig;
