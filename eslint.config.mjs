import eslint from "@eslint/js";
import angular from "angular-eslint";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".angular/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "test-results/**",
    ],
  },
  {
    files: ["projects/**/*.ts", "e2e/**/*.ts", "playwright.config.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
  },
  {
    files: ["projects/**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
  },
);
