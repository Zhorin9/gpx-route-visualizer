import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // MapLibre's worker imports a shared chunk, so it is built as a module.
  worker: { format: 'es' },
  test: {
    environment: 'jsdom',
  },
})
