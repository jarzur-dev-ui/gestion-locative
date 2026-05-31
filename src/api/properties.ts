import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, type components } from './client';

export type Property = components['schemas']['Property'];
export type CreateProperty = components['schemas']['CreateProperty'];
export type PatchProperty = components['schemas']['PatchProperty'];

export const PROPERTIES_QUERY_KEY = ['properties'] as const;

/**
 * Hook : liste des biens immobiliers du bailleur courant.
 *
 * Renvoie un tableau `Property[]`. Le toast d'erreur (hors 401) est piloté par
 * le global handler dans `query-client.ts`.
 */
export function useProperties() {
	return useQuery({
		queryKey: PROPERTIES_QUERY_KEY,
		queryFn: async () => {
			const { data, response } = await api.GET('/api/properties');
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
	});
}

/**
 * Hook : un bien immobilier par id.
 *
 * Désactivé tant que `id` est falsy (typique : navigate sur création).
 */
export function useProperty(id: string | undefined) {
	return useQuery({
		queryKey: [...PROPERTIES_QUERY_KEY, id],
		enabled: !!id,
		queryFn: async () => {
			const { data, response } = await api.GET('/api/properties/{id}', {
				params: { path: { id: id as string } },
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
	});
}

/**
 * Création d'un bien. Invalide la liste après succès.
 * Le toast succès doit être déclenché par l'appelant (`onSuccess`).
 */
export function useCreateProperty() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (body: CreateProperty) => {
			const { data, response } = await api.POST('/api/properties', { body });
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });
		},
	});
}

/**
 * Patch partiel (JSON Merge Patch — RFC 7396).
 * - clé absente : non touchée
 * - clé à `null` : effacée (uniquement pour colonnes nullables)
 * - clé valeur : mise à jour
 */
export function usePatchProperty() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (vars: { id: string; body: PatchProperty }) => {
			const { data, response } = await api.PATCH('/api/properties/{id}', {
				params: { path: { id: vars.id } },
				body: vars.body,
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });
			queryClient.setQueryData([...PROPERTIES_QUERY_KEY, data.id], data);
		},
	});
}

/**
 * Suppression d'un bien. Le backend renvoie 400 si un bail actif lui est lié ;
 * le global handler affichera alors un toast d'erreur explicite.
 */
export function useDeleteProperty() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { response } = await api.DELETE('/api/properties/{id}', {
				params: { path: { id } },
			});
			if (response.status !== 204) {
				throw new Error(`HTTP ${response.status}`);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });
		},
	});
}
