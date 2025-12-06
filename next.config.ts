import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],
  poweredByHeader: false,
};

export default nextConfig;
