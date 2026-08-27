import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          "selector": "CallExpression[callee.object.name='URL'][callee.property.name='createObjectURL']",
          "message": "Direct use of URL.createObjectURL is restricted. Please use the useExport hook instead."
        },
        {
          "selector": "Literal[value=/text-\\[\\d+px\\]/]",
          "message": "Arbitrary pixel sizes for text (e.g. text-[10px]) are forbidden. Please use standard token scales like text-xs or text-2xs."
        },
        {
          "selector": "TemplateElement[value.raw=/text-\\[\\d+px\\]/]",
          "message": "Arbitrary pixel sizes for text (e.g. text-[10px]) are forbidden. Please use standard token scales like text-xs or text-2xs."
        }
      ]
    }
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
