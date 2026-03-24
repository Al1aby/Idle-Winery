import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Idle-Winery/',
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.webp', '**/*.svg', '**/*.mp3', '**/*.ogg'],
})
