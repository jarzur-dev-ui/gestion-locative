import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type components } from './client';

export type ImportRequest = components['schemas']['ImportRequest'];
export type ImportReport = components['schemas']['ImportReport'];

export function useImportLegacy() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (body: ImportRequest) => {
			const { data, response } = await api.POST('/api/migration/import', { body });
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onSuccess: () => {
			// L'import touche presque tout — on invalide largement.
			qc.invalidateQueries({ queryKey: ['landlord-profile'] });
			qc.invalidateQueries({ queryKey: ['properties'] });
			qc.invalidateQueries({ queryKey: ['tenants'] });
			qc.invalidateQueries({ queryKey: ['guarantors'] });
			qc.invalidateQueries({ queryKey: ['leases'] });
		},
	});
}

/**
 * Lecture du localStorage legacy (clés `gl.bailleur` et `gl.baux`).
 * Retourne null si rien à importer.
 */
export function readLegacyLocalStorage(): ImportRequest | null {
	try {
		const bailleurRaw = window.localStorage.getItem('gl.bailleur');
		const bauxRaw = window.localStorage.getItem('gl.baux');
		if (!bailleurRaw && !bauxRaw) return null;
		const bailleur = bailleurRaw ? JSON.parse(bailleurRaw) : {};
		const baux = bauxRaw ? JSON.parse(bauxRaw) : [];
		return { bailleur, baux };
	} catch (err) {
		console.error('Failed to parse legacy localStorage', err);
		return null;
	}
}
