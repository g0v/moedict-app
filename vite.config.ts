import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

function getMoedictSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: resolve(__dirname, 'moedict.tw'),
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim()
  } catch {
    return ''
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_MOEDICT_SHA': JSON.stringify(getMoedictSha()),
    // Enable moedict.tw's bundled-data API shim even in browser-based `vite` dev,
    // where Capacitor has not injected window.Capacitor.
    'import.meta.env.VITE_MOEDICT_OFFLINE_APP': JSON.stringify('1'),
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    // Capacitor serves from local filesystem; use relative paths
    assetsDir: 'assets',
  },
})
