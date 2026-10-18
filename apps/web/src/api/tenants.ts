import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, type components } from './client';

export type Tenant = components['schemas']['Tenant'];
export type CreateTenantBody = components['schemas']['CreateTenant'];
export type PatchTenantBody = components['schemas']['PatchTenant'];

export const TENANTS_QUERY_KEY = ['tenants'] as const;

const tenantDetailKey = (id: string) => [...TENANTS_QUERY_KEY, id] as const;

/**
 * Liste tous les locataires créés par l'utilisateur courant.
 * GET /api/tenants
 */
export function useTenants() {
	return useQuery({
		queryKey: TENANTS_QUERY_KEY,
		queryFn: async () => {
			const { data, response } = await api.GET('/api/tenants');
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
	});
}

/**
 * Récupère un locataire par son identifiant.
 * GET /api/tenants/:id
 */
export function useTenant(id: string | undefined) {
	return useQuery({
		queryKey: id ? tenantDetailKey(id) : [...TENANTS_QUERY_KEY, 'detail', 'disabled'],
		enabled: Boolean(id),
		queryFn: async () => {
			if (!id) throw new Error('Missing tenant id');
			const { data, response } = await api.GET('/api/tenants/{id}', {
				params: { path: { id } },
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
	});
}

/**
 * Crée un locataire.
 * POST /api/tenants
 */
export function useCreateTenant() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (body: CreateTenantBody) => {
			const { data, response } = await api.POST('/api/tenants', { body });
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY });
		},
	});
}

/**
 * Mise à jour partielle (JSON Merge Patch).
 * PATCH /api/tenants/:id
 */
export function usePatchTenant() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (vars: { id: string; body: PatchTenantBody }) => {
			const { data, response } = await api.PATCH('/api/tenants/{id}', {
				params: { path: { id: vars.id } },
				body: vars.body,
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onSuccess: (updated) => {
			void queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY });
			queryClient.setQueryData(tenantDetailKey(updated.id), updated);
		},
	});
}

/**
 * Supprime un locataire.
 * DELETE /api/tenants/:id
 *
 * Le back renvoie 400 si un bail actif est rattaché — le global handler
 * affichera alors un toast d'erreur.
 */
export function useDeleteTenant() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { response } = await api.DELETE('/api/tenants/{id}', {
				params: { path: { id } },
			});
			if (response.status !== 204) {
				throw new Error(`HTTP ${response.status}`);
			}
			return id;
		},
		onSuccess: (id) => {
			void queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY });
			queryClient.removeQueries({ queryKey: tenantDetailKey(id) });
		},
	});
}
