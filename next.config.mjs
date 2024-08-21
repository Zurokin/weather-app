/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

const config = {
  images: {
    deviceSizes: [320, 420, 768, 1024, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    loader: "default",
    domains: [],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.weatherapi.com", pathname: "**" },
    ],
  },
  ...nextConfig,
};

export default config;
