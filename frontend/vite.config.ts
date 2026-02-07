import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const PROXY_TARGETS = {
  coston2: {
    fdcVerifier: 'https://fdc-verifiers-testnet.flare.network',
    daLayer: 'https://ctn2-data-availability.flare.network',
  },
  flare: {
    fdcVerifier: 'https://fdc-verifiers-mainnet.flare.network',
    daLayer: 'https://flr-data-availability.flare.network',
  },
} as const;

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const network = (env.VITE_NETWORK || 'coston2') as keyof typeof PROXY_TARGETS;
  const targets = PROXY_TARGETS[network] || PROXY_TARGETS.coston2;

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/fdc-verifier': {
          target: targets.fdcVerifier,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/fdc-verifier/, ''),
        },
        '/api/da-layer': {
          target: targets.daLayer,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/da-layer/, ''),
        },
      },
    },
  };
})
