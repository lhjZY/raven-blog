import type { NextConfig } from "next";

// A static site: `next build` writes every page to out/.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
