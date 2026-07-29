import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' -> relative asset paths, so the same build works on Vercel,
// Netlify, Cloudflare Pages AND GitHub Pages (project sites) without changes.
export default defineConfig({
  plugins: [react()],
  base: './',
})
