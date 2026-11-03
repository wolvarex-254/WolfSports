import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: [".manus.computer"],
    proxy: {
      "/framex-api": {
        target: "http://127.0.0.1:8080",
        rewrite: (path) => path.replace(/^\/framex-api/, "/api/v1"),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const forwardedHost = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
            const forwardedProto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
            const origin = req.headers.origin || (forwardedHost ? `${forwardedProto}://${forwardedHost}` : undefined);
            if (origin) proxyReq.setHeader("Origin", origin);
          });
        },
      },
      "/api/v1": { target: "http://127.0.0.1:8080" },
    },
  },
  preview: { port: 3000, host: "0.0.0.0", allowedHosts: [".manus.computer"] },
});
