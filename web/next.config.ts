import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML export: Vercel serves `out/` as plain files (reliable smoke test + hosting).
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
