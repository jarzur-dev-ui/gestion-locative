import classNames from 'classnames';
import { forwardRef, useId } from 'react';

import styles from './SelectField.module.scss';

import type { SelectFieldOption, SelectFieldProps } from './SelectField.types';

export type { SelectFieldOption, SelectFieldProps } from './SelectField.types';

const normalizeOption = (opt: SelectFieldOption): { value: string; label: string } =>
	typeof opt === 'string' ? { value: opt, label: opt } : opt;

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
	({ label, options, hint, id, className, ...otherProps }, ref) => {
		const generatedId = useId();
		const selectId = id ?? generatedId;
		return (
			<div className={classNames(styles.field, className)}>
				<label className={styles.label} htmlFor={selectId}>
					{label}
				</label>
				<select {...otherProps} className={styles.select} id={selectId} ref={ref}>
					{options.map((opt) => {
						const { value, label: optLabel } = normalizeOption(opt);
						return (
							<option key={value} value={value}>
								{optLabel}
							</option>
						);
					})}
				</select>
				{hint ? <span className={styles.hint}>{hint}</span> : null}
			</div>
		);
	},
);

SelectField.displayName = 'SelectField';
