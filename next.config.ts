import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Thumbnails and author photos uploaded to Sanity.
  images: { remotePatterns: [new URL("https://cdn.sanity.io/images/**")] },
};

export default nextConfig;
