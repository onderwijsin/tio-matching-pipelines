import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'
import json from '@eslint/json'
import markdown from '@eslint/markdown'
import { defineConfig } from 'eslint/config'
import globals from 'globals'

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
const config = [
	// Base JavaScript configuration
	{
		files: ['**/*.js', '**/*.jsx'],
		...eslint.configs.recommended,
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
		rules: {
			'no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
		},
	},

	// TypeScript configuration using defineConfig() properly
	...defineConfig({
		files: ['**/*.ts', '**/*.tsx'],
		extends: [
			eslint.configs.recommended,
			...tseslint.configs.recommendedTypeChecked,
			...tseslint.configs.stylisticTypeChecked,
		],
		languageOptions: {
			globals: {
				...globals.node,
			},
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
		},
	}),

	{
		plugins: {
			json,
		},
	},

	// lint JSON files
	{
		files: ['**/*.json'],
		ignores: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
		language: 'json/json',
		...json.configs.recommended,
	},

	// lint JSONC files
	{
		files: ['**/*.jsonc'],
		language: 'json/jsonc',
		...json.configs.recommended,
	},

	// lint JSON5 files
	{
		files: ['**/*.json5'],
		language: 'json/json5',
		...json.configs.recommended,
	},

	// Markdown configuration - spread the array properly
	...markdown.configs.recommended,

	// Customize markdown rules
	{
		files: ['**/*.md'],
		plugins: {
			markdown,
		},
		language: 'markdown/commonmark',
		rules: {
			// Disable the fenced-code-language rule if you don't want it
			'markdown/no-duplicate-headings': ['error', { checkSiblingsOnly: true }],
		},
	},

	// JavaScript code blocks in markdown
	{
		files: ['**/*.md/*.js', '**/*.md/*.jsx'],
		...eslint.configs.recommended,
	},

	// TypeScript code blocks in markdown - use defineConfig() and spread properly
	...defineConfig({
		files: ['**/*.md/*.ts', '**/*.md/*.tsx'],
		extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
		languageOptions: {
			parserOptions: {
				project: null, // Disable type checking for markdown code blocks
			},
		},
	}),

	// Prettier configuration (must be last)
	eslintConfigPrettier,
]

export default config
