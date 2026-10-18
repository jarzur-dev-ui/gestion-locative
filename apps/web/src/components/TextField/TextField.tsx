import classNames from 'classnames';
import {
	forwardRef,
	useId,
	type InputHTMLAttributes,
} from 'react';

import styles from './TextField.module.scss';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
	label: string;
	hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
	({ label, hint, id, className, ...otherProps }, ref) => {
		const generatedId = useId();
		const inputId = id ?? generatedId;
		return (
			<div className={classNames(styles.field, className)}>
				<label className={styles.label} htmlFor={inputId}>
					{label}
				</label>
				<input {...otherProps} className={styles.input} id={inputId} ref={ref} />
				{hint ? <span className={styles.hint}>{hint}</span> : null}
			</div>
		);
	},
);

TextField.displayName = 'TextField';
