import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/auth': 'http://127.0.0.1:8000',
      '/inventario': 'http://127.0.0.1:8000',
      '/productos': 'http://127.0.0.1:8000',
      '/categorias': 'http://127.0.0.1:8000',
      '/ventas': 'http://127.0.0.1:8000',
      '/usuarios': 'http://127.0.0.1:8000',
      '/conteos': 'http://127.0.0.1:8000',
      '/reportes': 'http://127.0.0.1:8000',
      '/auditoria': 'http://127.0.0.1:8000',
    },
  },
})
