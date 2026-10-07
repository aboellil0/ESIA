import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiOrigin = (env.VITE_API_PROXY_TARGET || "http://localhost:5000").replace(/\/+$/, "");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 8443,
      strictPort: true,
      proxy: {
        "/api": { target: apiOrigin, changeOrigin: true },
        "/uploads": { target: apiOrigin, changeOrigin: true },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 8443,
    },
  };
});
