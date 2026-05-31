import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, type components } from './client';

export type Guarantor = components['schemas']['Guarantor'];
export type GuarantorType = Guarantor['guarantorTypeKey'];
export type CreatePersonGuarantorBody = components['schemas']['CreatePersonGuarantor'];
export type CreateOrganizationGuarantorBody = components['schemas']['CreateOrganizationGuarantor'];
export type CreateGuarantorBody = components['schemas']['CreateGuarantor'];
export type PatchGuarantorBody = components['schemas']['PatchGuarantor'];

export const GUARANTORS_QUERY_KEY = ['guarantors'] as const;

const guarantorListKey = (typeFilter?: GuarantorType) =>
	(typeFilter
		? ([...GUARANTORS_QUERY_KEY, { type: typeFilter }] as const)
		: GUARANTORS_QUERY_KEY);

const guarantorDetailKey = (id: string) => [...GUARANTORS_QUERY_KEY, id] as const;

/**
 * Liste les garants créés par l'utilisateur courant.
 * GET /api/guarantors?type=person|organization
 */
export function useGuarantors(typeFilter?: GuarantorType) {
	return useQuery({
		queryKey: guarantorListKey(typeFilter),
		queryFn: async () => {
			const { data, response } = await api.GET('/api/guarantors', {
				params: { query: typeFilter ? { type: typeFilter } : {} },
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
	});
}

/**
 * Récupère un garant par son identifiant.
 * GET /api/guarantors/:id
 */
export function useGuarantor(id: string | undefined) {
	return useQuery({
		queryKey: id ? guarantorDetailKey(id) : [...GUARANTORS_QUERY_KEY, 'detail', 'disabled'],
		enabled: Boolean(id),
		queryFn: async () => {
			if (!id) throw new Error('Missing guarantor id');
			const { data, response } = await api.GET('/api/guarantors/{id}', {
				params: { path: { id } },
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
	});
}

/**
 * Crée un garant (personne physique OU organisation).
 *
 * Le body est une discriminated union sur `guarantorTypeKey` :
 *   - { guarantorTypeKey: 'person', firstName, lastName, email?, ... }
 *   - { guarantorTypeKey: 'organization', organizationName, organizationReference?, ... }
 *
 * POST /api/guarantors
 */
export function useCreateGuarantor() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (body: CreateGuarantorBody) => {
			const { data, response } = await api.POST('/api/guarantors', { body });
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: GUARANTORS_QUERY_KEY });
		},
	});
}

/**
 * Mise à jour partielle (JSON Merge Patch).
 *
 * /!\ `guarantorTypeKey` est immutable côté back : envoyer une valeur
 *    différente du type courant renvoie un 400 (géré par le global handler).
 *
 * PATCH /api/guarantors/:id
 */
export function usePatchGuarantor() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (vars: { id: string; body: PatchGuarantorBody }) => {
			const { data, response } = await api.PATCH('/api/guarantors/{id}', {
				params: { path: { id: vars.id } },
				body: vars.body,
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onSuccess: (updated) => {
			void queryClient.invalidateQueries({ queryKey: GUARANTORS_QUERY_KEY });
			queryClient.setQueryData(guarantorDetailKey(updated.id), updated);
		},
	});
}

/**
 * Supprime un garant.
 * DELETE /api/guarantors/:id
 *
 * Le back renvoie 400 si un bail actif est rattaché — toast géré globalement.
 */
export function useDeleteGuarantor() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { response } = await api.DELETE('/api/guarantors/{id}', {
				params: { path: { id } },
			});
			if (response.status !== 204) {
				throw new Error(`HTTP ${response.status}`);
			}
			return id;
		},
		onSuccess: (id) => {
			void queryClient.invalidateQueries({ queryKey: GUARANTORS_QUERY_KEY });
			queryClient.removeQueries({ queryKey: guarantorDetailKey(id) });
		},
	});
}
