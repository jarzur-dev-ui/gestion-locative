import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, type components } from './client';

export type LandlordProfile = components['schemas']['LandlordProfile'];
export type UpsertLandlordProfile = components['schemas']['UpsertLandlordProfile'];

export const LANDLORD_PROFILE_QUERY_KEY = ['landlord-profile'] as const;

/**
 * Hook pour récupérer le profil bailleur courant.
 * Retourne `null` si 404 (profil pas encore créé), throw sur autres erreurs.
 */
export function useLandlordProfile() {
	return useQuery({
		queryKey: LANDLORD_PROFILE_QUERY_KEY,
		queryFn: async () => {
			const { data, response } = await api.GET('/api/landlord-profile');
			if (response.status === 404) return null;
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
	});
}

/**
 * Upsert du profil bailleur (PUT — le backend gère création + update).
 * Le toast d'erreur est piloté par le global handler dans `query-client.ts`.
 */
export function useUpsertLandlordProfile() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (body: UpsertLandlordProfile) => {
			const { data, response } = await api.PUT('/api/landlord-profile', { body });
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(LANDLORD_PROFILE_QUERY_KEY, data);
		},
	});
}
