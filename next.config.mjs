import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@assets': path.resolve(__dirname, 'public/assets'),
    };

    // Only apply fallbacks in production builds, not in development
    if (!dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Exclude Node.js-specific modules from client bundle
    if (!isServer) {
      // These modules are Node.js-specific and shouldn't be bundled for browser
      // Browser uses native FormData API instead
      const webpack = require('webpack');
      config.plugins = config.plugins || [];
      
      // Replace Node.js modules with empty shims for browser builds
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^form-data$/,
          path.resolve(__dirname, 'webpack-form-data-shim.js')
        ),
        new webpack.NormalModuleReplacementPlugin(
          /^combined-stream$/,
          path.resolve(__dirname, 'webpack-form-data-shim.js')
        ),
        new webpack.NormalModuleReplacementPlugin(
          /^asynckit$/,
          path.resolve(__dirname, 'webpack-form-data-shim.js')
        ),
        new webpack.NormalModuleReplacementPlugin(
          /^has-flag$/,
          path.resolve(__dirname, 'webpack-form-data-shim.js')
        )
      );
    }

    return config;
  },
  
  // Improve performance
  compress: true,
  poweredByHeader: false,
  
  // React compatibility - enable strict mode for better error detection
  reactStrictMode: true,
  
  // Remove standalone output for development (only for production builds)
  // output: 'standalone',
  
  // Experimental features
  experimental: {
    optimizeCss: true,
  },
  
  // Development configuration
  // Development configuration
  // eslint: {
  //   ignoreDuringBuilds: false,
  // },

  // Enable Turbopack compatibility by defining an empty config
  // This acknowledges we have a custom webpack config but want to proceed
  turbopack: {},
  
  // Improve error handling
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // External packages
  serverExternalPackages: ['critters', 'react-i18next', 'i18next'],
};

export default nextConfig; 