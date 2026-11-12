import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // MapLibre's worker imports a shared chunk, so it is built as a module.
  worker: { format: 'es' },
  build: {
    rollupOptions: {
      // React and Konva change far less often than the app, so they stay cached across releases.
      output: { manualChunks: (id) => (/node_modules\/(react|react-dom|react-konva|react-reconciler|scheduler|konva)\//.test(id) ? 'vendor' : undefined) },
    },
  },
  test: { css: { include: [/\?raw$/] }, setupFiles: ['src/testSetup.ts'] },
})
