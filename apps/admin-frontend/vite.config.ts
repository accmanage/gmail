import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          charts: ["recharts"],
          realtime: ["socket.io-client"],
          vendor: ["axios", "zustand", "lucide-react", "papaparse"]
        }
      }
    }
  },
  server: {
    allowedHosts: [".ngrok-free.dev", ".ngrok.app", ".loca.lt", ".trycloudflare.com"],
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true
      },
      "/socket.io": {
        target: "http://localhost:4000",
        ws: true
      }
    }
  }
});
