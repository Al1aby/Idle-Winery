import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/Idle-Winery/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.webp', '**/*.svg', '**/*.mp3', '**/*.ogg'],
})
