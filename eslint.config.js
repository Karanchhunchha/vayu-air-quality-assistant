import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";

/*
 * ESLint 9 flat config.
 * - src/**: browser code — recommended JS rules, React + React Hooks
 *   recommended rules, and the jsx-a11y recommended accessibility rules.
 * - config files and Node scripts: Node globals, recommended JS rules.
 * - eslint-config-prettier goes last: it only turns OFF stylistic rules
 *   that would fight Prettier (formatting is Prettier's job, see
 *   .prettierrc.json). No project rule is disabled anywhere.
 */
export default [
  {
    ignores: ["dist/**", "docs/**", "coverage/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.flat.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },
  {
    files: ["*.config.js", "scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
  prettier,
];
