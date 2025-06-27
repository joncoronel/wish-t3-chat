import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  // experimental: {
  //   staleTimes: {
  //     dynamic: 30,
  //   },
  // },
  /* config options here */
  experimental: {
    ppr: "incremental",
  },
  // Exclude Supabase Edge Functions from Next.js compilation
  // transpilePackages: [],
  // typescript: {
  //   ignoreBuildErrors: false,
  // },
  // webpack: (config) => {
  //   // Ignore Supabase Edge Functions directory
  //   config.watchOptions = {
  //     ...config.watchOptions,
  //     ignored: ["**/supabase/functions/**"],
  //   };
  //   return config;
  // },
};

export default nextConfig;
