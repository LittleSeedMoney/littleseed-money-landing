import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/internal/ai/report-review/explain": ["./data/knowledge/**"],
  },
};

export default nextConfig;
