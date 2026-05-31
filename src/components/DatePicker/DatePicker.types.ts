export interface DatePickerFieldProps {
	label: string;
	/** Date au format ISO 'YYYY-MM-DD' ou `null`. */
	value: string | null;
	onChange: (value: string | null) => void;
	required?: boolean;
	/** Date minimale (incluse), format 'YYYY-MM-DD'. */
	minValue?: string;
	/** Date maximale (incluse), format 'YYYY-MM-DD'. */
	maxValue?: string;
	hint?: string;
	errorMessage?: string;
	disabled?: boolean;
}
