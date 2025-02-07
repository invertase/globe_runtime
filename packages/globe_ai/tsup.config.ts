import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["lib/globe_ai.ts"],  // Replace with your entry file
    format: ["esm"],   // Output both ESM & CommonJS (adjust as needed)
    dts: false,               // Disable TypeScript declaration files
    sourcemap: false,         // No source maps (optional)
    splitting: false,         // No code splitting (ensure single file output)
    minify: true,             // Minify output
    clean: true,              // Remove previous build files
    treeshake: true,          // Enable tree shaking
    outDir: "dist",           // Output directory
    outExtension: () => ({ js: ".mjs" }), // Ensures .mjs output
    target: "node18",         // Target runtime (adjust as needed)
    noExternal: [/(.*)/],
});