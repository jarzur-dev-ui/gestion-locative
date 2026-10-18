import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export const base = [
	globalIgnores(['dist']),
	{
		files: ['**/*.{ts,tsx}'],
		extends: [js.configs.recommended, tseslint.configs.recommended],
	},
];

export const react = [
	...base,
	{
		files: ['**/*.{ts,tsx}'],
		extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
		languageOptions: { globals: globals.browser },
	},
];
