import { defineConfig } from 'vite';

// "base" is relative so the built site works on GitHub Pages
// (https://<user>.github.io/<repo>/) and on any other static host.
export default defineConfig({
  base: './',
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler' },
    },
  },
  build: {
    outDir: 'dist',
  },
});
