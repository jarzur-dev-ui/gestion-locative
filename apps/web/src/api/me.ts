import { useQuery } from '@tanstack/react-query';

import { api, type components } from './client';

export type MyLease = components['schemas']['Lease'];

export const MY_LEASES_QUERY_KEY = ['me', 'leases'] as const;

/**
 * Liste des baux où l'utilisateur courant est partie (locataire ou garant).
 * Vide [] pour un landlord (qui a son propre /api/leases).
 */
export function useMyLeases() {
	return useQuery({
		queryKey: MY_LEASES_QUERY_KEY,
		queryFn: async () => {
			const { data, response } = await api.GET('/api/me/leases');
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
	});
}
