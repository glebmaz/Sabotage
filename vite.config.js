import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Sabotage/',
  build: {
    outDir: 'dist',
  },
  server: {
    open: true,
  },
});
