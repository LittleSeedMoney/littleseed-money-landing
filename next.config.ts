import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["100.72.156.43"],
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/internal/ai/report-review/explain": ["./data/knowledge/**"],
  },
};

export default nextConfig;
