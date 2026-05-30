import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// 1 minute : les données ne sont pas refetch en arrière-plan tant qu'elles
			// sont fraîches. Adapté à une app de gestion locative où les changements
			// sont rares (vs un dashboard temps réel).
			staleTime: 60 * 1000,
			// On retry une seule fois sur erreur réseau ; pas sur 4xx (déclarés par TanStack
			// via la fonction retry ci-dessous).
			retry: (failureCount, error) => {
				// Pas de retry sur les erreurs métier (401, 403, 404, 409, 410, etc.)
				if (error instanceof Error && /HTTP 4\d\d/.test(error.message)) return false;
				return failureCount < 1;
			},
			refetchOnWindowFocus: false,
		},
		mutations: {
			// Pas de retry sur mutation : le user verra une erreur explicite et
			// pourra retenter manuellement.
			retry: false,
		},
	},
});
