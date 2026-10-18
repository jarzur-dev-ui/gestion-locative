import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, type components } from './client';

export type Lease = components['schemas']['Lease'];
export type CreateLease = components['schemas']['CreateLease'];
export type PatchLease = components['schemas']['PatchLease'];
export type UpdateLeaseStatus = components['schemas']['UpdateLeaseStatus'];
export type LeaseStatus = Lease['statusKey'];
export type LeaseTypeKey = Lease['leaseTypeKey'];

export const LEASES_QUERY_KEY = ['leases'] as const;

export interface LeasesFilters {
	status?: LeaseStatus;
}

/**
 * Hook : liste des baux du bailleur courant (filtre status optionnel).
 *
 * Chaque entrée inclut déjà ses `tenants` et `guarantors` dénormalisés
 * (summaries — id + identité), évitant un N+1 côté UI.
 */
export function useLeases(filters: LeasesFilters = {}) {
	return useQuery({
		queryKey: [...LEASES_QUERY_KEY, filters],
		queryFn: async () => {
			const { data, response } = await api.GET('/api/leases', {
				params: { query: filters },
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
	});
}

/**
 * Hook : un bail par id (avec tenants + guarantors dénormalisés).
 */
export function useLease(id: string | undefined) {
	return useQuery({
		queryKey: [...LEASES_QUERY_KEY, id],
		enabled: !!id,
		queryFn: async () => {
			const { data, response } = await api.GET('/api/leases/{id}', {
				params: { path: { id: id as string } },
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
	});
}

/**
 * Création d'un bail. Le body inclut les jointures `tenantIds[]` et
 * `guarantorIds[]` qui sont matérialisées côté back (M2M).
 */
export function useCreateLease() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (body: CreateLease) => {
			const { data, response } = await api.POST('/api/leases', { body });
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: LEASES_QUERY_KEY });
		},
	});
}

/**
 * Patch partiel (JSON Merge Patch).
 *
 * - `propertyId` est immuable côté back.
 * - `statusKey` se gère via `useChangeLeaseStatus` (endpoint dédié).
 * - `tenantIds`/`guarantorIds` absents = jointures inchangées ;
 *   présents = remplacement intégral.
 */
export function usePatchLease() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (vars: { id: string; body: PatchLease }) => {
			const { data, response } = await api.PATCH('/api/leases/{id}', {
				params: { path: { id: vars.id } },
				body: vars.body,
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: LEASES_QUERY_KEY });
			queryClient.setQueryData([...LEASES_QUERY_KEY, data.id], data);
		},
	});
}

/**
 * Transition de statut d'un bail (draft → active → ended).
 * Endpoint séparé pour bien matérialiser la machine à états côté back.
 */
export function useChangeLeaseStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (vars: { id: string; statusKey: LeaseStatus }) => {
			const { data, response } = await api.PATCH('/api/leases/{id}/status', {
				params: { path: { id: vars.id } },
				body: { statusKey: vars.statusKey },
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: LEASES_QUERY_KEY });
			queryClient.setQueryData([...LEASES_QUERY_KEY, data.id], data);
		},
	});
}

/**
 * Suppression d'un bail. Le backend n'autorise la suppression que sur les
 * baux en statut `draft` — sinon 400 et le global handler affiche le toast.
 */
export function useDeleteLease() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { response } = await api.DELETE('/api/leases/{id}', {
				params: { path: { id } },
			});
			if (response.status !== 204) {
				throw new Error(`HTTP ${response.status}`);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: LEASES_QUERY_KEY });
		},
	});
}
