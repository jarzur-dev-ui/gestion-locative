import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react';

import { DEFAULT_BAILLEUR } from '@/config/defaults';
import type {
	Bail,
	Bailleur,
} from '@/types';

interface DataContextValue {
	bailleur: Bailleur;
	setBailleur: (bailleur: Bailleur) => void;
	baux: Bail[];
	upsertBail: (bail: Bail) => void;
	removeBail: (id: string) => void;
	getBail: (id: string) => Bail | undefined;
}

const BAILLEUR_KEY = 'gl.bailleur';
const BAUX_KEY = 'gl.baux';

const read = <T,>(key: string, fallback: T): T => {
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
};

const DataContext = createContext<DataContextValue | null>(null);

export const DataProvider = ({ children }: { children: ReactNode }) => {
	const [bailleur, setBailleur] = useState<Bailleur>(() =>
		read(BAILLEUR_KEY, DEFAULT_BAILLEUR),
	);
	const [baux, setBaux] = useState<Bail[]>(() => read(BAUX_KEY, []));

	useEffect(() => {
		localStorage.setItem(BAILLEUR_KEY, JSON.stringify(bailleur));
	}, [bailleur]);

	useEffect(() => {
		localStorage.setItem(BAUX_KEY, JSON.stringify(baux));
	}, [baux]);

	const value = useMemo<DataContextValue>(
		() => ({
			bailleur,
			setBailleur,
			baux,
			upsertBail: (bail) =>
				setBaux((prev) => {
					const index = prev.findIndex((b) => b.id === bail.id);
					if (index === -1) {
						return [...prev, bail];
					}
					const copy = [...prev];
					copy[index] = bail;
					return copy;
				}),
			removeBail: (id) => setBaux((prev) => prev.filter((b) => b.id !== id)),
			getBail: (id) => baux.find((b) => b.id === id),
		}),
		[bailleur, baux],
	);

	return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextValue => {
	const ctx = useContext(DataContext);
	if (!ctx) {
		throw new Error('useData doit être utilisé dans un DataProvider');
	}
	return ctx;
};
