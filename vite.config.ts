import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { BRAND } from "./src/config/brand";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: BRAND.name,
        short_name: BRAND.shortName,
        description: BRAND.tagline,
        theme_color: "#14506b",
        background_color: "#faf6ee",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        globIgnores: ["**/sentry-*.js"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === "flagcdn.com" || url.pathname.includes("/flags/"),
            handler: "CacheFirst",
            options: {
              cacheName: "flaggo-flags",
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@flaggo/core": path.resolve(__dirname, "packages/core/src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("packages/core/src/data/countries")) return "countries";
          if (id.includes("node_modules/@sentry")) return "sentry";
          if (id.includes("node_modules/@supabase/")) return "supabase";
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) return "react";
          return undefined;
        }
      }
    }
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8796"
    },
    fs: {
      allow: [__dirname]
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "server/**/*.test.{ts,tsx}", "packages/core/**/*.test.{ts,tsx}"]
  }
});
