import { defineConfig } from "oxlint";
import { legacyClasses } from "./scripts/legacy-classes.mjs";

export default defineConfig({
  plugins: ["react"],
  jsPlugins: ["@shadcn/lint"],
  ignorePatterns: ["dist/**", "build/**", "coverage/**", "node_modules/**", "src/paraglide/**"],
  // Temporary property exceptions for existing Bootstrap components only.
  // Remove each entry when its component migrates; new files get the strict rule.
  overrides: [
    {
      files: ["src/components/AppNavbar.tsx"],
      rules: { "shadcn/no-inline-styles": ["error", { allow: ["color"] }] },
    },
    {
      files: ["src/components/SummaryResult.tsx"],
      rules: { "shadcn/no-inline-styles": ["error", { allow: ["width"] }] },
    },
    {
      files: ["src/components/MultiYearComparison.tsx"],
      rules: { "shadcn/no-inline-styles": ["error", { allow: ["width"] }] },
    },
    {
      files: ["src/components/InputPanel.tsx"],
      rules: { "shadcn/no-inline-styles": ["error", { allow: ["width"] }] },
    },
    {
      files: ["src/components/WFHRatioChart.tsx"],
      rules: { "shadcn/no-inline-styles": ["error", { allow: ["fontSize", "background"] }] },
    },
    {
      files: ["src/pages/SalarySplitReference.tsx"],
      rules: { "shadcn/no-inline-styles": ["error", { allow: ["color", "marginTop"] }] },
    },
    {
      files: ["src/pages/PensionReference.tsx"],
      rules: { "shadcn/no-inline-styles": ["error", { allow: ["color", "border"] }] },
    },
    {
      files: ["src/pages/ReferenceOverview.tsx"],
      rules: { "shadcn/no-inline-styles": ["error", { allow: ["color", "border", "fontSize"] }] },
    },
    {
      files: ["src/pages/reference/components.tsx"],
      rules: {
        "shadcn/no-inline-styles": [
          "error",
          { allow: ["border", "borderBottom", "color", "fontWeight", "maxWidth", "flexShrink"] },
        ],
      },
    },
  ],
  rules: {
    "shadcn/no-arbitrary-values": "error",
    "shadcn/no-raw-colors": "error",
    "shadcn/no-inline-styles": "error",
    "shadcn/no-unknown-classes": ["error", { allow: legacyClasses }],
  },
});
