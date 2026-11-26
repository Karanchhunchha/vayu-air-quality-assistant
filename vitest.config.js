import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

/*
 * Vitest reads this file (not vite.config.js) so the production build
 * config stays untouched. Coverage is scoped to src/lib — the pure logic
 * layer (data maths, chat engine, eco-game rules, class-name helper);
 * React components are presentational and exercised through it.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      coverage: {
        provider: "v8",
        include: ["src/lib/**/*.js"],
        exclude: ["src/lib/**/*.test.js"],
        reporter: ["text", "html"],
      },
    },
  }),
);
