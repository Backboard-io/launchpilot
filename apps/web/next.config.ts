import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
  output: "standalone",
  // When served from API container, proxy /v1 to backend (uvicorn on BACKEND_PORT).
  rewrites: async () => [
    { source: "/v1", destination: "http://127.0.0.1:9000/v1" },
    { source: "/v1/:path*", destination: "http://127.0.0.1:9000/v1/:path*" },
  ],
};

export default nextConfig;
