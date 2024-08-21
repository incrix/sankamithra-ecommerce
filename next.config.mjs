/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://192.168.1.5:3333/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "e-com.incrix.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    esmExternals: "loose",
  },
};

export default nextConfig;
