import type { ButtonProps as RACButtonProps } from 'react-aria-components';
import type { ReactNode } from 'react';

export type ButtonVariant = 'filled' | 'outlined' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<RACButtonProps, 'children'> {
	children?: ReactNode;
	variant?: ButtonVariant;
	/**
	 * Forwarded to the underlying button element for type-specific styling
	 * or form submission. Default: 'button'.
	 */
	type?: 'button' | 'submit' | 'reset';
	/**
	 * Alias HTML-style de `isDisabled` (convention React standard). Le wrapper
	 * accepte les deux : `disabled` est mappé vers `isDisabled` au runtime,
	 * permettant aux consommateurs existants de ne pas migrer.
	 */
	disabled?: boolean;
}
