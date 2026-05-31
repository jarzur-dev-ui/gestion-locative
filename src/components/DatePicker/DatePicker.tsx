import { parseDate, type DateValue } from '@internationalized/date';
import {
	Button as RACButton,
	Calendar,
	CalendarCell,
	CalendarGrid,
	DateInput,
	DatePicker,
	DateSegment,
	Dialog,
	Group,
	Heading,
	I18nProvider,
	Label,
	Popover,
	Text,
} from 'react-aria-components';
import { useId } from 'react';

import styles from './DatePicker.module.scss';

import type { DatePickerFieldProps } from './DatePicker.types';

export type { DatePickerFieldProps } from './DatePicker.types';

/**
 * Safely parses an ISO `YYYY-MM-DD` string into a react-aria `DateValue`.
 * Returns `null` if the input is null/undefined/empty or has an invalid format.
 * Logs a console warning on invalid format.
 */
const safeParseDate = (value: string | null | undefined): DateValue | null => {
	if (!value) {
		return null;
	}
	try {
		return parseDate(value);
	} catch (err) {
		console.warn(
			`[DatePickerField] Invalid date value "${value}". Expected format YYYY-MM-DD.`,
			err,
		);
		return null;
	}
};

export const DatePickerField = ({
	label,
	value,
	onChange,
	required = false,
	minValue,
	maxValue,
	hint,
	errorMessage,
	disabled = false,
}: DatePickerFieldProps) => {
	const generatedId = useId();
	const hintId = `${generatedId}-hint`;
	const errorId = `${generatedId}-error`;

	const dateValue = safeParseDate(value);
	const minDateValue = safeParseDate(minValue);
	const maxDateValue = safeParseDate(maxValue);

	const handleChange = (dv: DateValue | null): void => {
		// `.toString()` on CalendarDate returns `YYYY-MM-DD`.
		onChange(dv ? dv.toString() : null);
	};

	const describedBy = [
		hint ? hintId : null,
		errorMessage ? errorId : null,
	]
		.filter(Boolean)
		.join(' ') || undefined;

	return (
		<I18nProvider locale="fr-FR">
			<DatePicker
				className={styles.field}
				value={dateValue}
				onChange={handleChange}
				isRequired={required}
				isDisabled={disabled}
				isInvalid={Boolean(errorMessage)}
				minValue={minDateValue ?? undefined}
				maxValue={maxDateValue ?? undefined}
				aria-describedby={describedBy}
			>
				<Label className={styles.label}>{label}</Label>
				<Group className={styles.group}>
					<DateInput className={styles.input}>
						{(segment) => (
							<DateSegment className={styles.segment} segment={segment} />
						)}
					</DateInput>
					<RACButton className={styles.trigger} aria-label="Ouvrir le calendrier">
						<CalendarIcon />
					</RACButton>
				</Group>
				{hint ? (
					<Text id={hintId} slot="description" className={styles.hint}>
						{hint}
					</Text>
				) : null}
				{errorMessage ? (
					<Text id={errorId} slot="errorMessage" className={styles.error}>
						{errorMessage}
					</Text>
				) : null}
				<Popover className={styles.popover} placement="bottom start">
					<Dialog className={styles.dialog}>
						<Calendar className={styles.calendar} firstDayOfWeek="mon">
							<header className={styles.calendarHeader}>
								<RACButton
									slot="previous"
									className={styles.calendarNav}
									aria-label="Mois précédent"
								>
									{'<'}
								</RACButton>
								<Heading className={styles.calendarHeading} />
								<RACButton
									slot="next"
									className={styles.calendarNav}
									aria-label="Mois suivant"
								>
									{'>'}
								</RACButton>
							</header>
							<CalendarGrid className={styles.calendarGrid}>
								{(date) => (
									<CalendarCell className={styles.calendarCell} date={date} />
								)}
							</CalendarGrid>
						</Calendar>
					</Dialog>
				</Popover>
			</DatePicker>
		</I18nProvider>
	);
};

const CalendarIcon = () => (
	<svg
		aria-hidden="true"
		focusable="false"
		viewBox="0 0 24 24"
		width="16"
		height="16"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
		<line x1="16" y1="2" x2="16" y2="6" />
		<line x1="8" y1="2" x2="8" y2="6" />
		<line x1="3" y1="10" x2="21" y2="10" />
	</svg>
);
