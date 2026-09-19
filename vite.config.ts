import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  // host: true is required for the dev server to be reachable from a
  // container (GitHub Codespaces, Docker). Harmless locally.
  server: { host: true, port: 5173 },
  build: { outDir: 'dist', sourcemap: false },
});
