import type { NextConfig } from "next";

const devOriginsEnv = process.env.NEXT_DEV_ALLOWED_ORIGINS;
const allowedDevOrigins =
  devOriginsEnv?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseImageRemotePatterns = supabaseUrl
  ? [{
      protocol: new URL(supabaseUrl).protocol.replace(":", "") as "http" | "https",
      hostname: new URL(supabaseUrl).hostname,
      pathname: "/storage/v1/object/public/brochure-images/**",
    }]
  : [];

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedDevOrigins.length ? allowedDevOrigins : undefined,
  images: {
    remotePatterns: supabaseImageRemotePatterns,
  },
  serverExternalPackages: ["ws", "xlsx"],
};

export default nextConfig;
