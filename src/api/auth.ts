import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, type components } from './client';

export type CurrentUser = components['schemas']['UserPublic'];
export type UserRole = CurrentUser['role'];

export const ME_QUERY_KEY = ['auth', 'me'] as const;

/**
 * Hook pour récupérer l'utilisateur courant.
 * Retourne `null` si pas connecté (401 du back).
 */
export function useAuth() {
	return useQuery({
		queryKey: ME_QUERY_KEY,
		queryFn: async () => {
			const { data, response } = await api.GET('/api/auth/me');
			if (response.status === 401) return null;
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		staleTime: 30 * 1000,
		retry: false,
		// On veut savoir tout de suite si le user est connecté ou non au boot
		refetchOnMount: 'always',
	});
}

export function useLogin() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (vars: { email: string; password: string }) => {
			const { data, response } = await api.POST('/api/auth/login', { body: vars });
			if (response.status === 401) {
				throw new Error('Identifiants invalides');
			}
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(ME_QUERY_KEY, data.user);
		},
	});
}

export function useLogout() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			await api.POST('/api/auth/logout');
		},
		onSuccess: () => {
			queryClient.setQueryData(ME_QUERY_KEY, null);
			// Vide tous les caches (sécurité : le prochain user qui se connecte
			// ne doit pas voir les données de l'ancien)
			queryClient.clear();
		},
	});
}

export function useAcceptInvitation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (vars: { token: string; password: string }) => {
			const { data, response } = await api.POST('/api/invitations/accept', { body: vars });
			if (response.status === 410) {
				throw new Error('Lien d\'invitation invalide ou expiré');
			}
			if (response.status === 409) {
				throw new Error('Un compte existe déjà avec cet email');
			}
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(ME_QUERY_KEY, data.user);
		},
	});
}

/**
 * Route par défaut selon le rôle.
 * Landlord va sur les biens, locataire/garant sur "Mon dossier" (Phase 4).
 */
export function defaultRouteForRole(role: UserRole): string {
	if (role === 'landlord') return '/biens';
	return '/mon-dossier';
}
