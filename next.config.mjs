import path from 'node:path';

const mediapipeTasksVisionWebpackAlias = path.resolve(
  process.cwd(),
  'node_modules/@mediapipe/tasks-vision/vision_bundle.mjs',
);
const mediapipeTasksVisionTurbopackAlias =
  './node_modules/@mediapipe/tasks-vision/vision_bundle.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.56.1'],
  experimental: {
    workerThreads: true,
  },
  serverExternalPackages: ['mongodb', '@stream-io/node-sdk'],
  turbopack: {
    resolveAlias: {
      '@mediapipe/tasks-vision': mediapipeTasksVisionTurbopackAlias,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@mediapipe/tasks-vision$': mediapipeTasksVisionWebpackAlias,
    };

    return config;
  },
};

export default nextConfig;
