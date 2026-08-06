import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: [
        'localhost:3000',
        '127.0.0.1:3000',
        'trycloudflare.com',
        '*.trycloudflare.com',
        'ngrok-free.app',
        '*.ngrok-free.app',
      ],
    },
  },
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    'trycloudflare.com',
    '*.trycloudflare.com',
    'ngrok-free.app',
    '*.ngrok-free.app',
  ],
};

export default nextConfig;
