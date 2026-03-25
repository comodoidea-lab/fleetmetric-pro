import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages deployment, set base to your repo name: '/your-repo-name/'
// For localhost development, leave as '/'
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
  },
})
