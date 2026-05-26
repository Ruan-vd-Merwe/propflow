/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse reads test files from disk at import time.
  // Without this, Vercel's bundler includes it in the serverless bundle and
  // the readFileSync call fails because those test files don't exist there.
  // Marking it external makes Next.js use native require() at runtime instead.
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
};

export default nextConfig;
