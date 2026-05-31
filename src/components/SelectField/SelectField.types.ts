import type { SelectHTMLAttributes } from 'react';

/**
 * Option d'un SelectField.
 * - String : valeur = label.
 * - Object : value/label distincts (utile pour des enums backend avec libellé FR).
 */
export type SelectFieldOption = string | { value: string; label: string };

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
	label: string;
	options: readonly SelectFieldOption[];
	hint?: string;
}
