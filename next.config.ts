import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // async redirects() {
  //   return [
  //     {
  //       source: '/:path((?!^$|\\/$))*',
  //       destination: '/',
  //       permanent: true,
  //     },
  //   ];
  // },
  async rewrites() {
    return [
      {
        // Catch-all rewrite for client-side routing (SPA fallback)
        // Excludes: /api/*, /_next/*, /favicon.ico, and static files with extensions
        source: '/:path((?!api|_next|favicon\\.ico|.*\\..*).*)',
        destination: '/',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
