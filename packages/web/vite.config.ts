import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (/[\\/](react|react-dom|react-router)[\\/]/.test(id)) return 'vendor-react'
            if (id.includes('@clerk')) return 'vendor-clerk'
            if (/[\\/](react-markdown|remark-gfm|unified|remark|rehype|mdast|unist|micromark)[\\/]/.test(id)) return 'vendor-markdown'
            if (/[\\/](react-hook-form|zod)[\\/]/.test(id)) return 'vendor-form'
            if (id.includes('@tanstack')) return 'vendor-query'
            if (/[\\/](date-fns|clsx|tailwind-merge)[\\/]/.test(id)) return 'vendor-utils'
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
