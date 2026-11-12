import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { discordApiPlugin } from './server/discordDevServer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), discordApiPlugin()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
