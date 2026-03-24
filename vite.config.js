import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Allows importing assets from src/assets
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.webp', '**/*.svg', '**/*.mp3', '**/*.ogg'],
})
