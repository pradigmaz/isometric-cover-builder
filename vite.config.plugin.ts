import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  root: path.resolve(__dirname, 'src/plugin/ui'),
  build: {
    outDir: path.resolve(__dirname, 'dist/plugin-temp'),
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/plugin/ui/index.html'),
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
