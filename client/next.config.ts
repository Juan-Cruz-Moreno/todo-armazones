import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve the app under the subpath `/tienda`.
  // This makes Next.js generate routes and static assets prefixed with `/tienda`.
  basePath: "/tienda",
  allowedDevOrigins: ["http://localhost:3000"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "api.juancruzmoreno.dev",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "api.todoarmazonesarg.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "api.todoarmazonesarg.com",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
