import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // REMOVE output: 'export' for dynamic routes
  // output: 'export',
  
  distDir: '.next', // Keep as .next for standard build
  
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.mazad.click' },
      { protocol: 'http', hostname: '**.mazad.click' },
      { protocol: 'https', hostname: '**.easyeats.dz' },
      { protocol: 'http', hostname: '**.easyeats.dz' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'mazadclick-server.onrender.com' }
    ]
  },
  
  // Keep trailingSlash for better routing
  // trailingSlash: true,
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development' 
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https: http://127.0.0.1:* http://localhost:*; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' http://127.0.0.1:* ws://127.0.0.1:* https://mazadclick-server.onrender.com wss://mazadclick-server.onrender.com https://api.easyeats.dz wss://api.easyeats.dz; frame-ancestors 'self';"
              : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.mazad.click https://mazadclick-server.onrender.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://mazadclick-server.onrender.com wss://mazadclick-server.onrender.com https://api.easyeats.dz wss://api.easyeats.dz; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';"
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          }
        ]
      }
    ];
  },
  
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

    if (!isServer) {
      const webpack = require('webpack');
      config.plugins = config.plugins || [];
      
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
  
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  
  experimental: {
    optimizeCss: true,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error"], // Removes log, warn, info, debug, etc.
    } : false,
  },
  
  turbopack: {},
  
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  serverExternalPackages: ['critters', 'react-i18next', 'i18next'],
};

export default nextConfig;