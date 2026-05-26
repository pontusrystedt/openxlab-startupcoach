import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["unpdf", "mammoth"],
}

export default nextConfig
