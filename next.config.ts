import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["nodemailer", "web-push"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
