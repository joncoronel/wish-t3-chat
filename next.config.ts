import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  // experimental: {
  //   staleTimes: {
  //     dynamic: 30,
  //   },
  // },
  /* config options here */
};

export default nextConfig;
