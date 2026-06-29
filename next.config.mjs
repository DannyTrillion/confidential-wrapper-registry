/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Reveal page moved from /decrypt → /reveal; keep old links/bookmarks working.
  async redirects() {
    return [{ source: "/decrypt", destination: "/reveal", permanent: true }];
  },
  webpack: (config) => {
    // The relayer SDK bundle ships WASM and expects these to be optional in the browser.
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
