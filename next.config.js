/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Prevent AFRAME-related dependencies from being loaded
    config.resolve.alias = {
      ...config.resolve.alias,
      // Prevent loading aframe and related packages
      'aframe': false,
      'aframe-extras': false,
      '3d-force-graph-vr': false
    }
    
    // This is necessary for the file system module in parser.js
    config.resolve.fallback = { 
      fs: false,
      path: false 
    };
    
    return config;
  },
}

module.exports = nextConfig
