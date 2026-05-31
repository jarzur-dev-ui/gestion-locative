import createClient from 'openapi-fetch';
import type { paths } from './schema.gen';

/**
 * Client typé pour l'API gestion-locative-api.
 *
 * - Toutes les routes et payloads sont typés depuis l'OpenAPI auto-générée
 *   (`pnpm gen:api`).
 * - `credentials: 'include'` envoie automatiquement le cookie `gl_session`
 *   (HttpOnly, géré par le backend après login).
 * - L'URL de base vient de `VITE_API_URL` (configurable par environnement).
 */
export const api = createClient<paths>({
	baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
	credentials: 'include',
});

export type { paths, components } from './schema.gen';
