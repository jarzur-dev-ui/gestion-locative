import classNames from 'classnames';
import {
	forwardRef,
	type ButtonHTMLAttributes,
	type ReactNode,
} from 'react';

import styles from './Button.module.scss';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children?: ReactNode;
	variant?: 'filled' | 'outlined' | 'ghost' | 'danger';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ children, className, variant = 'filled', type = 'button', ...otherProps }, ref) => (
		<button
			{...otherProps}
			className={classNames(styles.button, styles[variant], className)}
			ref={ref}
			type={type}
		>
			{children}
		</button>
	),
);

Button.displayName = 'Button';
