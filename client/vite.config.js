import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In dev, forward API + WebSocket traffic to the Express server so the client
// can use same-origin URLs (same as production, where Express serves the build).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
      '/socket.io': { target: 'http://localhost:4000', ws: true },
    },
  },
});
