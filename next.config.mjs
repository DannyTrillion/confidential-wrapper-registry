/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The standalone Reveal page was folded into My Balances. Keep old links and
  // bookmarks working (including the original /decrypt path).
  async redirects() {
    return [
      { source: "/reveal", destination: "/balances", permanent: true },
      { source: "/decrypt", destination: "/balances", permanent: true },
    ];
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
