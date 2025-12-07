import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for production and memory efficiency
  compress: true,
  poweredByHeader: false,
  
  // Reduce memory usage during builds
  experimental: {
    // Optimize memory usage
    optimizePackageImports: ['react', 'react-dom'],
  },
  
  // Output configuration for Cloud Run
  output: 'standalone',
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
