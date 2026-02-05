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
        "./node_modules/@zkprivacysol/sdk-core/dist/index.js",
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
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        injected: path.resolve(__dirname, "src/injected.ts"),
        content: path.resolve(__dirname, "src/content.ts"),
        background: path.resolve(__dirname, "src/background.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep injected, content, and background scripts at root level with .js extension
          if (["injected", "content", "background"].includes(chunkInfo.name)) {
            return "[name].js";
          }
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        manualChunks: {
          vendor: ["react", "react-dom", "framer-motion"],
          solana: ["@solana/web3.js", "@coral-xyz/anchor"],
          zk: ["snarkjs", "circomlibjs", "@zkprivacysol/sdk-core"],
        },
      },
    },
    // Don't minify for easier debugging during development
    minify: false,
  },
  publicDir: "public",
});
