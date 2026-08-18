import nx from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';

export const moduleBoundaryConfig = [
  ...nx.configs['flat/base'],
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {parser: tseslint.parser},
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: ['**/*.config.{js,mjs,ts,mts}', '**/wdio.conf.ts'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:lib'],
            },
            {
              sourceTag: 'scope:audio-input',
              onlyDependOnLibsWithTags: [
                'scope:audio-input',
                'scope:audio',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'scope:audio',
              onlyDependOnLibsWithTags: ['scope:audio', 'scope:shared'],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
          ],
        },
      ],
    },
  },
];
