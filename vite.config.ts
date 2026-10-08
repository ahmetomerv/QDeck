import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tanstackStart({ server: { entry: "server" } }),
    tailwindcss(),
    nitro({ preset: "node-server" }),
    react(),
  ],
  resolve: { tsconfigPaths: true },
});
