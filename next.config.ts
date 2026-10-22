import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  typescript: {
    // Next.js uses tsconfig.nextjs.json to avoid conflicts with the Vite
    // composite-references tsconfig.json used by `tsc -b` during the
    // coexistence period. Remove this option when Vite is retired.
    tsconfigPath: './tsconfig.nextjs.json',
  },
}

export default nextConfig
