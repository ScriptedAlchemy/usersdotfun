import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

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
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart({ customViteReactPlugin: true }),
    viteReact(),
    tailwindcss()
  ],
})
