/** @type {import('next').NextConfig} */
const nextConfig = {
  // Show compilation start message
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Enable detailed webpack output
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = await originalEntry();
        console.log('\n🔨 Compiling application...\n');
        return entries;
      };
    }
    return config;
  },
}

module.exports = nextConfig
