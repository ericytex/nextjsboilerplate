/** @type {import('next').NextConfig} */
const nextConfig = {
  // Improve chunk loading reliability
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
}

module.exports = nextConfig

