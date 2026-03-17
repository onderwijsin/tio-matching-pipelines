/** @type {import('prettier').Config} */
export default {
	semi: false,
	singleQuote: true,
	trailingComma: 'all',
	proseWrap: 'always',
	printWidth: 100,
	tabWidth: 4,
	useTabs: true,
	overrides: [
		{
			files: ['*.yaml', '*.yml'],
			options: {
				tabWidth: 2,
				// Setting useTabs just in case. Prettier _should_ ignore it and
				// default to spaces for YAML. Also, somehow prettier does not
				// respect the `indent_size` in .editorconfig for YAML files.
				useTabs: false,
			},
		},
		{
			files: ['*.md'],
			options: {
				tabWidth: 2,
				useTabs: false,
			},
		},
	],
}
