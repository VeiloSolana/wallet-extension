/// <reference types="vite/client" />

import type { Buffer } from "buffer";

declare global {
  interface Window {
    Buffer: typeof Buffer;
    process: NodeJS.Process;
    global: typeof globalThis;
  }

  // Augment globalThis
  var Buffer: typeof import("buffer").Buffer;
  var process: NodeJS.Process;
}

// Type declaration for @zkprivacysol/sdk-core
declare module "@zkprivacysol/sdk-core" {
  export * from "@zkprivacysol/sdk-core/dist/src/index";
}
