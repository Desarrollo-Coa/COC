import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // Solo advertencia
      '@typescript-eslint/no-unused-vars': 'warn', // Solo advertencia
      'react-hooks/exhaustive-deps': 'error', // Error crítico
     },
  },
];

export default eslintConfig;
