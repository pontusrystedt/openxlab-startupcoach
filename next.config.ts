import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["unpdf", "mammoth"],
  async redirects() {
    return [
      {
        source: "/startups",
        destination: "/coaching",
        permanent: true,
      },
      {
        source: "/startups/:path*",
        destination: "/coaching/:path*",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
