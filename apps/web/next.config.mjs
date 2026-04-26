/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ltd2-coach/engine', '@ltd2-coach/ltd2-client'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.legiontd2.com',
      },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
