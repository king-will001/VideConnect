import { globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier';
import tailwindcss from 'eslint-plugin-tailwindcss';

const config = [
  globalIgnores(['public/clerk-assets/**']),
  ...nextVitals,
  ...tailwindcss.configs['flat/recommended'],
  prettier,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
    rules: {
      'tailwindcss/no-custom-classname': 'off',
    },
  },
];

export default config;
