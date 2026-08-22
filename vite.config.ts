import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static build → dist/. base is configurable for GitHub Pages project sites
// (set BASE_PATH="/repo-name/" in CI); defaults to "/" for user sites / Netlify / Vercel.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
