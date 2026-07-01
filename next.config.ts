import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    images: {
        unoptimized: process.env.NODE_ENV !== "production",
        remotePatterns: [
            {
                protocol: "http",
                hostname: "localhost",
                port: "8000",
                pathname: "/media/**",
            },
            {
                protocol: "https",
                hostname: "nexo-media.s3.amazonaws.com",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;
