import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// proxy /api to the express server so cookies work the same as in production
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // vite only binds to ::1 without this, so 127.0.0.1:5173 refuses to connect
    // also lets a real phone on the same wifi load the site
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true
      }
    }
  }
});
