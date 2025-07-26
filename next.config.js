/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 在Vercel上部署时不需要这些设置
  // assetPrefix: process.env.NODE_ENV === "production" ? "/voice-accounting-app" : "",
  // basePath: process.env.NODE_ENV === "production" ? "/voice-accounting-app" : "",
}

module.exports = nextConfig
