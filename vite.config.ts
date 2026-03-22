import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Capacitor serves from local filesystem; use relative paths
    assetsDir: 'assets',
  },
})
