import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src'),
      '@components': resolve(rootDir, 'src/components'),
      '@features': resolve(rootDir, 'src/features'),
      '@hooks': resolve(rootDir, 'src/hooks'),
      '@lib': resolve(rootDir, 'src/lib'),
      '@store': resolve(rootDir, 'src/store'),
      '@config': resolve(rootDir, 'src/config'),
      '@types': resolve(rootDir, 'src/types'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});