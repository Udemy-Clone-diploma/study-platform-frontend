import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "localhost",
                port: "8000",
                pathname: "/media/**",
            },
        ],
    },
    // Polling is required in Docker bind mounts (devcontainers, Codespaces, etc.)
    // because inotify events are not forwarded across the bind boundary.
    // This only applies when running `next dev --webpack` (see package.json).
    webpack: (config) => {
        config.watchOptions = {
            poll: 500,
            aggregateTimeout: 200,
        };
        return config;
    },
};

export default nextConfig;
