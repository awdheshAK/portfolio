import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This rule (from the React Compiler-oriented hooks lint set) flags
      // every "fetch on mount" / "hydrate from localStorage on mount"
      // effect in the app — the standard pattern used throughout
      // services-backed pages (product/shop/account listings), the
      // auth/cart providers, and the customizer's draft restore. None of
      // these are the cascading-render footgun the rule targets (a render
      // loop from state derived from props/state within the same
      // component); they're one-time synchronization with an external
      // system (the API, localStorage) on mount. Downgraded to a warning
      // rather than disabled so genuinely new cascading-render bugs are
      // still visible.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
