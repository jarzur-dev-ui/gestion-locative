export const formatAmount = (value: number): string =>
	value.toLocaleString('fr-FR', {
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
	});

export const formatDateFr = (iso: string): string => {
	if (!iso) {
		return '';
	}
	const [year, month, day] = iso.split('-');
	if (!year || !month || !day) {
		return iso;
	}
	return `${day}/${month}/${year}`;
};

export const todayIso = (): string => {
	const now = new Date();
	const offset = now.getTimezoneOffset() * 60000;
	return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export const slugify = (value: string): string =>
	value
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase() || 'bien';
