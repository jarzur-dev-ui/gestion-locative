import classNames from 'classnames';
import { Button as RACButton } from 'react-aria-components';

import styles from './Button.module.scss';

import type { ButtonProps } from './Button.types';

export type { ButtonProps, ButtonVariant } from './Button.types';

/**
 * Bouton wrappé sur `react-aria-components/Button`.
 *
 * - Utilise `onPress` (convention react-aria) plutôt que `onClick`. `onPress`
 *   gère uniformément clic souris, tap tactile et activation clavier.
 * - Garde l'API simple : `variant`, `children`, `isDisabled` (via RAC), etc.
 * - Si tu as besoin d'un comportement de soumission de formulaire, passe `type="submit"`.
 */
export const Button = ({
	children,
	className,
	variant = 'filled',
	type = 'button',
	disabled,
	isDisabled,
	...otherProps
}: ButtonProps) => (
	<RACButton
		{...otherProps}
		className={classNames(styles.button, styles[variant], className)}
		isDisabled={isDisabled ?? disabled}
		type={type}
	>
		{children}
	</RACButton>
);
