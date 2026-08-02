/**
 * vite.config.ts — Vite dev server config for TSIO Innovation Hub React SPA.
 *
 * Dev server: 0.0.0.0:3000 (Pivota Preview compatible — bind to all interfaces)
 * Proxy /api/* → Express backend on port 3001 (same-origin, no CORS issues)
 *
 * Security: X-Frame-Options headers are NOT set here — Pivota Preview requires
 * iframeable pages. CSP is set server-side only.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist/client',
  },
  server: {
    host: '0.0.0.0',   // Bind to all interfaces for Pivota Preview
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',  // Express backend
        changeOrigin: true,
      },
    },
  },
});
