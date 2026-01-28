import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5200,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate animation libraries and large assets
          'lottie': ['lottie-react'],
          'animations': ['./src/assets/flies-only.json', './src/assets/poker.json', './src/assets/tired-emoji.json'],
          // Vendor chunks
          'vendor': ['react', 'react-dom', 'framer-motion', 'uuid'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit since we know about the large chunks
  },
})
