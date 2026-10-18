// CSS modules are read as `styles.fooBar`, so camelCase; kebab/snake only where TSX builds the
// name at runtime (`styles[`state-${x}`]`, `styles[`status_${key}`]`), react-aria's own classes.
const classPattern = '^(?:[a-z][a-zA-Z0-9]*(?:[-_][a-z0-9]+)*|react-aria-[A-Za-z]+)$';

export default {
	extends: ['stylelint-config-standard-scss', 'stylelint-config-css-modules'],
	rules: {
		'selector-class-pattern': [
			classPattern,
			{ message: 'Classe CSS module : camelCase (ou kebab/snake si le nom est calculé en TSX)' },
		],
		'keyframes-name-pattern': '^[a-z][a-zA-Z0-9]*$',
	},
};
