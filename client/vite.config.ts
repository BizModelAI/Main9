import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react({
      include: "**/*.{jsx,tsx}",
    }),
  ],
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "..", "shared"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'lucide-react', 'react-icons'],
          charts: ['recharts'],
          // Business logic chunks
          business: ['@shared/businessPaths', '@shared/businessModelTraits'],
          utils: ['@shared/utils', '@shared/scoring'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5073,
    proxy: {
      '/api': {
        target: 'http://localhost:5073',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
