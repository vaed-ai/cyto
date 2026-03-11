import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const isGhPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig = {
  reactStrictMode: false,
  output: 'export',
  basePath: isGhPages ? '/cyto' : '',
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@vaed-ai/cyto': path.resolve(__dirname, 'index.tsx'),
    };
    // ?raw imports: return raw file content as string
    // Must exclude ?raw from all existing loaders, then add raw rule
    config.module.rules.forEach(rule => {
      if (rule.oneOf) {
        rule.oneOf.unshift({
          resourceQuery: /raw/,
          type: 'asset/source',
        });
      }
      // For non-oneOf rules that might match tsx
      if (rule.test && !rule.oneOf) {
        if (!rule.resourceQuery) {
          rule.resourceQuery = { not: [/raw/] };
        }
      }
    });
    // Top-level fallback
    config.module.rules.push({
      resourceQuery: /raw/,
      type: 'asset/source',
    });
    return config;
  },
}

export default nextConfig
