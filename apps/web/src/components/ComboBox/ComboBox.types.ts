import type { ReactNode } from 'react';

export interface ComboBoxFieldProps<T> {
	label: string;
	items: readonly T[];
	getKey: (item: T) => string;
	getLabel: (item: T) => string;
	/**
	 * Optional override for the text used to match items during typeahead
	 * filtering. Defaults to {@link ComboBoxFieldProps.getLabel}.
	 */
	getSearchText?: (item: T) => string;
	/**
	 * Optional custom renderer for an item in the dropdown. Defaults to the
	 * label returned by {@link ComboBoxFieldProps.getLabel}.
	 */
	renderItem?: (item: T) => ReactNode;

	/** Currently selected key (or the free-text value when allowsCustomValue). */
	value: string | null;
	/** Called with the selected key, the free-text value, or `null` if cleared. */
	onChange: (key: string | null) => void;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	/**
	 * When `true`, the user can submit a value that does not match any item.
	 * The raw input string is forwarded to {@link ComboBoxFieldProps.onChange}.
	 */
	allowsCustomValue?: boolean;
	hint?: string;
	errorMessage?: string;
	className?: string;
}
