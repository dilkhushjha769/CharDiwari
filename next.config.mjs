/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  images: {
    // Listing photos are served from Unsplash (their URLs carry sizing query strings).
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/**" },
    ],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: '/track-property',
        destination: '/track',
      },
    ];
  },
};

export default nextConfig;
