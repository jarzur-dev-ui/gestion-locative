import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, type components } from './client';

export type RentPeriod = components['schemas']['RentPeriod'];
export type RentPeriodList = components['schemas']['RentPeriodList'];
export type Adjustment = components['schemas']['Adjustment'];
export type UpdateRentPeriod = components['schemas']['UpdateRentPeriod'];
export type RentPeriodStatusKey = RentPeriod['statusKey'];
export type AdjustmentType = Adjustment['type'];

export type Lease = components['schemas']['Lease'];
export type Property = components['schemas']['Property'];

/**
 * Clé racine pour les rent-periods.
 *
 * On expose une clé "list" qui prend les filtres en argument, et on garde la
 * racine en clé invalidable globalement (mark-paid/unpaid invalident tout).
 */
export const RENT_PERIODS_QUERY_KEY = ['rent-periods'] as const;

export interface RentPeriodFilters {
	leaseId?: string;
	status?: RentPeriodStatusKey;
	periodMonth?: string;
}

const rentPeriodsListKey = (filters?: RentPeriodFilters) =>
	[...RENT_PERIODS_QUERY_KEY, 'list', filters ?? {}] as const;

/**
 * Liste filtrable des périodes de loyer pour le bailleur courant.
 *
 * Les filtres alimentent à la fois les query params et la cache key, donc
 * changer un filtre déclenche un refetch automatique.
 */
export function useRentPeriods(filters?: RentPeriodFilters) {
	return useQuery({
		queryKey: rentPeriodsListKey(filters),
		queryFn: async () => {
			const { data, response } = await api.GET('/api/rent-periods', {
				params: { query: filters },
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
	});
}

/**
 * PATCH ajustements (TEOM, solde antérieur, régul charges, autre).
 * Le back refuse 409 si le statut n'est plus "draft" — toast erreur global.
 */
export function usePatchRentPeriod() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (vars: { id: string; body: UpdateRentPeriod }) => {
			const { data, response } = await api.PATCH('/api/rent-periods/{id}', {
				params: { path: { id: vars.id } },
				body: vars.body,
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: RENT_PERIODS_QUERY_KEY });
		},
	});
}

/**
 * Forcer l'envoi de l'avis d'échéance (par défaut le scheduler le fait à J-10).
 */
export function useSendNotice() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { data, response } = await api.POST('/api/rent-periods/{id}/send-notice', {
				params: { path: { id } },
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: RENT_PERIODS_QUERY_KEY });
		},
	});
}

/**
 * Mark-paid AVEC OPTIMISTIC UPDATE.
 *
 * UX critique : le toggle Oui/Non doit donner un feedback instantané.
 *
 * Pattern :
 *   1. onMutate :
 *      - cancelQueries(RENT_PERIODS_QUERY_KEY)  // évite race condition refetch
 *      - getQueriesData(...)                    // snapshot multi-clés (filtres)
 *      - setQueriesData(...)                    // patch local : statusKey='paid', paidAt=now
 *      - retourne { previous } dans le context
 *   2. onError(_, _, context) :
 *      - setQueryData(...) pour chaque clé snapshotée → rollback complet
 *   3. onSettled :
 *      - invalidateQueries(RENT_PERIODS_QUERY_KEY) → refetch source de vérité
 *        (récupère receiptDocumentId, paidByUserId réels, etc.)
 */
export function useMarkPaid() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { data, response } = await api.POST('/api/rent-periods/{id}/mark-paid', {
				params: { path: { id } },
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onMutate: async (id) => {
			// 1. Cancel les refetch en cours pour qu'ils n'écrasent pas notre patch local.
			await queryClient.cancelQueries({ queryKey: RENT_PERIODS_QUERY_KEY });

			// 2. Snapshot de toutes les caches (la page peut avoir plusieurs listes en cache
			// pour différents filtres ; on les patche toutes pour rester cohérent).
			const previous = queryClient.getQueriesData<RentPeriodList>({
				queryKey: RENT_PERIODS_QUERY_KEY,
			});

			// 3. Optimistic update.
			const optimisticPaidAt = new Date().toISOString();
			queryClient.setQueriesData<RentPeriodList>(
				{ queryKey: RENT_PERIODS_QUERY_KEY },
				(old) =>
					old?.map((rp) =>
						rp.id === id
							? {
									...rp,
									statusKey: 'paid' as const,
									paidAt: optimisticPaidAt,
								}
							: rp,
					),
			);

			return { previous };
		},
		onError: (_err, _id, context) => {
			// Rollback : on remet chaque cache exactement comme avant.
			if (!context?.previous) return;
			for (const [key, snapshot] of context.previous) {
				queryClient.setQueryData(key, snapshot);
			}
		},
		onSettled: () => {
			// On invalide pour récupérer la "vraie" donnée serveur (receiptDocumentId, etc.).
			void queryClient.invalidateQueries({ queryKey: RENT_PERIODS_QUERY_KEY });
		},
	});
}

/**
 * Annulation du paiement (fenêtre 24h côté back, vérifiée aussi côté front
 * pour éviter un round-trip inutile).
 *
 * Pas d'optimistic update : action rare, on préfère attendre la confirmation
 * back (et si 410 fenêtre dépassée, on veut surtout afficher l'erreur, pas
 * faire flasher le toggle).
 */
export function useMarkUnpaid() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { data, response } = await api.POST('/api/rent-periods/{id}/mark-unpaid', {
				params: { path: { id } },
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: RENT_PERIODS_QUERY_KEY });
		},
	});
}

// ─── Helpers pour enrichir l'affichage (bail + adresse bien) ─────────────────
//
// On garde ces hooks côté rent-periods pour ne pas marcher sur les fichiers
// des autres agents (Biens, Locataires/Garants). C'est purement de la lecture
// secondaire pour l'affichage des cartes — pas de mutation.

export function useLease(id: string | undefined) {
	return useQuery({
		queryKey: ['leases', id],
		enabled: !!id,
		queryFn: async () => {
			const { data, response } = await api.GET('/api/leases/{id}', {
				params: { path: { id: id! } },
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
	});
}

export function useProperty(id: string | undefined) {
	return useQuery({
		queryKey: ['properties', id],
		enabled: !!id,
		queryFn: async () => {
			const { data, response } = await api.GET('/api/properties/{id}', {
				params: { path: { id: id! } },
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
	});
}
