export interface Periode {
	debut: string; // ISO yyyy-mm-dd
	fin: string;
}

const pad = (n: number): string => String(n).padStart(2, '0');

const lastDay = (year: number, month: number): number =>
	new Date(year, month, 0).getDate();

export const periodeForMonth = (year: number, month: number): Periode => ({
	debut: `${year}-${pad(month)}-01`,
	fin: `${year}-${pad(month)}-${pad(lastDay(year, month))}`,
});

export const nextMonth = (
	year: number,
	month: number,
): { year: number; month: number } =>
	month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

export const echeanceIso = (
	year: number,
	month: number,
	jour: number,
): string => {
	const day = Math.min(Math.max(jour, 1), lastDay(year, month));
	return `${year}-${pad(month)}-${pad(day)}`;
};
