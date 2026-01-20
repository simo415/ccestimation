import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set base to repository name so built assets load correctly when served from GitHub Pages
export default defineConfig({
  base: '/ccestimation/',
  plugins: [react()],
})
