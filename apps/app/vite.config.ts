import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api/ws': {
        target: process.env.GATEWAY_URL || 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@usersdotfun/shared-db': resolve(__dirname, '../../packages/shared-db/src'),
      '@usersdotfun/shared-types': resolve(__dirname, '../../packages/shared-types/src')
    }
  },
  optimizeDeps: {
    exclude: ['@usersdotfun/shared-db', '@usersdotfun/shared-types']
  },
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart({ customViteReactPlugin: true }),
    viteReact(),
    tailwindcss()
  ],
})
