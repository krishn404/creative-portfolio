/** @type {import('next').NextConfig} */
const nextConfig = {
  // Align with metadata canonical URLs (no trailing slash on paths).
  trailingSlash: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.art.krixnx.xyz" }],
        destination: "https://art.krixnx.xyz/:path*",
        permanent: true,
      },
    ]
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uxwing.com',
      },
    ],
  },
}

export default nextConfig
