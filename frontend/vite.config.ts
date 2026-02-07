import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/fdc-verifier': {
        target: 'https://fdc-verifiers-testnet.flare.network',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fdc-verifier/, ''),
      },
      '/api/da-layer': {
        target: 'https://ctn2-data-availability.flare.network',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/da-layer/, ''),
      },
    },
  },
})
