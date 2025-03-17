/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // This is necessary for the file system module in parser.js
    config.resolve.fallback = { 
      fs: false,
      path: false 
    };
    
    return config;
  },
}

module.exports = nextConfig
