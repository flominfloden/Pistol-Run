import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  publicDir: "assets",
  server: { port: 5183, host: "127.0.0.1" },
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1200,
  },
});
