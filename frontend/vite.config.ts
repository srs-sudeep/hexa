import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// Get __dirname equivalent for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url))

// Check if SSL certificates exist
const certPath = resolve(__dirname, 'certs/cert.pem')
const keyPath = resolve(__dirname, 'certs/key.pem')
const hasSSL = existsSync(certPath) && existsSync(keyPath)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    https: hasSSL ? {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
    } : false,
    hmr: {
      host: 'localhost'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    global: 'globalThis',
  }
})
