import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5241",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
