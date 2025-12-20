import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ["buffer", "process", "util", "stream", "events", "crypto"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@zkprivacysol/sdk-core": path.resolve(
        __dirname,
        "./node_modules/@zkprivacysol/sdk-core/dist/src/index.js"
      ),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
    include: ["@zkprivacysol/sdk-core"],
  },
});
