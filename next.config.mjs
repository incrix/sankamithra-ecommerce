/** @type {import('next').NextConfig} */
const nextConfig = {
  // REMOVED: a catch-all proxy of /api/* to a LAN backend at 192.168.1.5:3333
  // that no longer exists. Array rewrites run as "afterFiles", which is BEFORE
  // dynamic routes - so it silently swallowed every dynamic API route
  // (/api/orders/[id] returned 500 ECONNREFUSED) while static ones worked.
  // Restore it only alongside a reachable backend, and scope the source so it
  // cannot shadow this app's own route handlers.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thunder.sankamithra.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    esmExternals: "loose",
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
