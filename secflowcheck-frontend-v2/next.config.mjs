/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    API_URL: process.env.API_URL,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/:path*', // Use 'gateway' hostname for Docker internal network
      },
    ]
  },
}

export default nextConfig
