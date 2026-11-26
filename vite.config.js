import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project site: https://karanchhunchha.github.io/vayu-air-quality-assistant/
export default defineConfig({
  plugins: [react()],
  base: "/vayu-air-quality-assistant/",
});
