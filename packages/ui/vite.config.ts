import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// We emit assets into `dist/static/...` (matching the bull-board protocol)
// and a `dist/index.html` template that the post-build step renames to
// `index.ejs` so the express adapter can render it with EJS placeholders.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'static',
    rollupOptions: {
      output: {
        entryFileNames: 'static/[name].[hash].js',
        chunkFileNames: 'static/[name].[hash].js',
        assetFileNames: 'static/[name].[hash][extname]',
      },
    },
  },
  server: {
    port: 9000,
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
});
