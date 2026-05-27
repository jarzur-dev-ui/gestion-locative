import classNames from 'classnames';
import {
	forwardRef,
	useId,
	type SelectHTMLAttributes,
} from 'react';

import styles from './SelectField.module.scss';

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
	label: string;
	options: readonly string[];
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
	({ label, options, id, className, ...otherProps }, ref) => {
		const generatedId = useId();
		const selectId = id ?? generatedId;
		return (
			<div className={classNames(styles.field, className)}>
				<label className={styles.label} htmlFor={selectId}>
					{label}
				</label>
				<select {...otherProps} className={styles.select} id={selectId} ref={ref}>
					{options.map((opt) => (
						<option key={opt} value={opt}>
							{opt}
						</option>
					))}
				</select>
			</div>
		);
	},
);

SelectField.displayName = 'SelectField';
