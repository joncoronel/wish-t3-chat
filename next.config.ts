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
};

export default nextConfig;
