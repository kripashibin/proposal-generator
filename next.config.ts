import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silences the workspace-root warning: web/ has its own package-lock.json
  // and .git, but the parent proposal-generator/ directory (unrelated
  // legacy files from a prior task) has no git root of its own, which
  // otherwise confuses Turbopack's root inference.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
