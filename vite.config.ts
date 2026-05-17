import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false, // Dynamic manifest served by server per business
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "client/src") },
  },
  optimizeDeps: {
    disabled: true,
  },
  root: "client",
  build: { outDir: "../dist/public", emptyOutDir: true },
  server: {
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true },
      "/manifest.webmanifest": { target: "http://localhost:5000", changeOrigin: true },
    },
  },
});
