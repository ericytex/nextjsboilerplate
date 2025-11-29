/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper chunk generation
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Ensure chunks are generated properly in dev mode
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
      }
    }
    return config
  },
}

module.exports = nextConfig

