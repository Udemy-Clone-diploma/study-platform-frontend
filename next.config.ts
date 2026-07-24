import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
    output: "standalone",
    images: {
        unoptimized: process.env.NODE_ENV !== "production",
        // Decorative background art ("00 2.svg" etc.) is served as SVG; Next blocks
        // SVG through the image optimizer by default, so it 400s in production
        // without this. Recommended safe defaults per the Next.js docs.
        dangerouslyAllowSVG: true,
        contentDispositionType: "attachment",
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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

export default withNextIntl(nextConfig);
