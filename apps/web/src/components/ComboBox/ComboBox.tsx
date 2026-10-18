import classNames from 'classnames';
import { useMemo } from 'react';
import {
	Button as RACButton,
	ComboBox,
	Input,
	Label,
	ListBox,
	ListBoxItem,
	Popover,
	type Key,
} from 'react-aria-components';

import styles from './ComboBox.module.scss';

import type { ComboBoxFieldProps } from './ComboBox.types';

export type { ComboBoxFieldProps } from './ComboBox.types';

/**
 * Lowercase + strip diacritics for accent-insensitive substring filtering.
 *
 * Uses NFD normalization to split a character like `é` into `e` + combining
 * acute accent, then drops the combining-mark range U+0300–U+036F.
 */
function normalizeForSearch(input: string): string {
	return input
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();
}

/**
 * Generic ComboBox field built on top of `react-aria-components`.
 *
 * Provides client-side, accent-insensitive typeahead filtering over an array
 * of arbitrary items, while accepting just two adapter functions (`getKey`,
 * `getLabel`) so it stays usable with strings, numbers, or domain objects.
 */
export function ComboBoxField<T>(props: ComboBoxFieldProps<T>) {
	const {
		label,
		items,
		getKey,
		getLabel,
		getSearchText,
		renderItem,
		value,
		onChange,
		placeholder,
		disabled,
		required,
		allowsCustomValue,
		hint,
		errorMessage,
		className,
	} = props;

	// Build an index of items by key so the controlled `value` -> selectedKey
	// lookup and the free-text reconciliation stay O(1).
	const itemsByKey = useMemo(() => {
		const map = new Map<string, T>();
		for (const item of items) {
			map.set(getKey(item), item);
		}
		return map;
	}, [items, getKey]);

	const selectedItem = value != null ? itemsByKey.get(value) : undefined;

	// Resolve the text currently shown in the input:
	// - if `value` matches a known item key -> show its label
	// - if `value` is unknown (custom value or stale key) -> show the raw value
	// - otherwise empty
	const inputValue: string = selectedItem
		? getLabel(selectedItem)
		: (value ?? '');

	// Filter items client-side using a normalized substring match. When the
	// input is empty (or exactly matches the selected label, i.e. nothing has
	// been typed since selection) we show every item.
	const filteredItems = useMemo(() => {
		const query = inputValue.trim();
		if (query.length === 0) {
			return items;
		}
		const isShowingSelectedLabel =
			selectedItem !== undefined && inputValue === getLabel(selectedItem);
		if (isShowingSelectedLabel) {
			return items;
		}
		const normalizedQuery = normalizeForSearch(query);
		return items.filter((item) => {
			const haystack = getSearchText ? getSearchText(item) : getLabel(item);
			return normalizeForSearch(haystack).includes(normalizedQuery);
		});
	}, [items, inputValue, selectedItem, getLabel, getSearchText]);

	const handleSelectionChange = (key: Key | null): void => {
		if (key == null) {
			onChange(null);
			return;
		}
		// `Key` is `string | number`; we normalize back to string since the
		// public API contract is `string | null`. getKey always returns a
		// string, so this is just a cast for the react-aria type.
		onChange(String(key));
	};

	const handleInputChange = (next: string): void => {
		if (!allowsCustomValue) {
			// In strict mode we let react-aria drive the input and only react
			// to selection changes; if the user clears the field, mirror that.
			if (next.length === 0 && value != null) {
				onChange(null);
			}
			return;
		}
		// Custom values: forward the raw text. If the text happens to match
		// the label of an existing item, prefer its key so downstream consumers
		// can still treat the value as a "known" reference.
		if (next.length === 0) {
			onChange(null);
			return;
		}
		const matched = items.find((item) => getLabel(item) === next);
		onChange(matched ? getKey(matched) : next);
	};

	// react-aria expects `selectedKey` to be `null` when nothing is selected,
	// or a `Key` that exists in the rendered collection. If the controlled
	// value points to an item not in `items`, we deselect on the RAC side and
	// rely on `inputValue` to keep showing the raw text.
	const selectedKey: Key | null = selectedItem ? value : null;

	return (
		<ComboBox
			className={classNames(styles.field, className)}
			selectedKey={selectedKey}
			onSelectionChange={handleSelectionChange}
			inputValue={inputValue}
			onInputChange={handleInputChange}
			isDisabled={disabled}
			isRequired={required}
			isInvalid={errorMessage != null}
			allowsCustomValue={allowsCustomValue}
			allowsEmptyCollection
			menuTrigger="focus"
		>
			<Label className={styles.label}>{label}</Label>
			<div className={styles.inputWrapper}>
				<Input className={styles.input} placeholder={placeholder} />
				<RACButton className={styles.trigger} aria-label="Ouvrir la liste">
					<svg
						className={styles.chevron}
						width="12"
						height="12"
						viewBox="0 0 12 12"
						aria-hidden="true"
						focusable="false"
					>
						<path
							d="M2 4.5 L6 8.5 L10 4.5"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</RACButton>
			</div>
			{hint != null && errorMessage == null ? (
				<span className={styles.hint}>{hint}</span>
			) : null}
			{errorMessage != null ? (
				<span className={styles.error}>{errorMessage}</span>
			) : null}
			<Popover className={styles.popover}>
				<ListBox<T>
					className={styles.listBox}
					items={filteredItems}
					renderEmptyState={() => (
						<div className={styles.empty}>Aucun résultat</div>
					)}
				>
					{(item) => (
						<ListBoxItem
							id={getKey(item)}
							textValue={getLabel(item)}
							className={styles.option}
						>
							{renderItem ? renderItem(item) : getLabel(item)}
						</ListBoxItem>
					)}
				</ListBox>
			</Popover>
		</ComboBox>
	);
}
