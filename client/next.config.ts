import type { NextConfig } from "next";

const devOriginsEnv = process.env.NEXT_DEV_ALLOWED_ORIGINS;
const allowedDevOrigins =
  devOriginsEnv?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedDevOrigins.length ? allowedDevOrigins : undefined,
};

export default nextConfig;
