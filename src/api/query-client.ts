import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { toast } from '@/components/Toast';

const PUBLIC_PATHS = ['/login', '/accept-invitation'];

function isAuthError(error: unknown): boolean {
	if (!(error instanceof Error)) return false;
	return /HTTP 401|Non authentifi/.test(error.message);
}

function isOnPublicPage(): boolean {
	const path = window.location.pathname;
	return PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Handler global pour toutes les erreurs (queries + mutations).
 *
 * - 401 sur une page protégée → toast + redirect vers /login
 * - 401 sur la page de login elle-même → silencieux (la mutation login gère son propre affichage)
 * - autres erreurs → toast (la mutation peut aussi afficher inline si elle le veut, le toast s'ajoute)
 */
function handleApiError(error: unknown, source: 'query' | 'mutation'): void {
	if (!(error instanceof Error)) return;

	if (isAuthError(error)) {
		if (!isOnPublicPage()) {
			toast.error('Votre session a expiré, veuillez vous reconnecter.');
			// Hard redirect : on ne dispose pas de navigate() hors de l'arbre React,
			// et un reload propre permet de wipe le state local + cache TanStack.
			window.location.href = '/login';
		}
		return;
	}

	const prefix = source === 'mutation' ? 'Erreur : ' : '';
	toast.error(`${prefix}${error.message}`);
}

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => handleApiError(error, 'query'),
	}),
	mutationCache: new MutationCache({
		onError: (error) => handleApiError(error, 'mutation'),
	}),
	defaultOptions: {
		queries: {
			staleTime: 60 * 1000,
			retry: (failureCount, error) => {
				if (error instanceof Error && /HTTP 4\d\d/.test(error.message)) return false;
				return failureCount < 1;
			},
			refetchOnWindowFocus: false,
		},
		mutations: {
			retry: false,
		},
	},
});
