import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/economic-world-abm/",
  plugins: [react()]
});

