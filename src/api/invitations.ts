import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type components } from './client';
import { GUARANTORS_QUERY_KEY } from './guarantors';
import { TENANTS_QUERY_KEY } from './tenants';

export type CreateInvitationBody = components['schemas']['CreateInvitation'];
export type InvitationCreatedRaw = components['schemas']['InvitationCreatedResponse'];

/**
 * Réponse enrichie côté client : le back renvoie `{ token, expiresAt }`,
 * et on reconstruit ici le `shareUrl` (magic link) à partir de l'origin courant.
 *
 * Ce magic link sera affiché dans une modal "Copier le lien" en attendant
 * l'envoi d'email réel (qui n'est qu'un stub en V1 côté back).
 */
export interface InvitationCreated extends InvitationCreatedRaw {
	shareUrl: string;
}

function buildShareUrl(token: string): string {
	const origin = typeof window !== 'undefined' ? window.location.origin : '';
	return `${origin}/accept-invitation/${token}`;
}

/**
 * Crée une invitation pour un locataire OU un garant.
 * POST /api/invitations
 *
 * Retourne `{ token, expiresAt, shareUrl }` — le `shareUrl` est reconstruit
 * côté client (le back ne le renvoie pas en V1).
 *
 * Côté back :
 *   - 400 = pas d'email sur la cible (handler global → toast)
 *   - 404 = cible introuvable (handler global → toast)
 *   - 409 = compte déjà créé pour cette cible (handler global → toast)
 *
 * Après création, on invalide les listes tenants/guarantors selon la cible
 * pour que la pastille "✓ Compte créé / ⏳ Pas encore invité(e)" se rafraîchisse
 * dès que le user clique sur le magic link et active son compte.
 */
export function useCreateInvitation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (body: CreateInvitationBody): Promise<InvitationCreated> => {
			const { data, response } = await api.POST('/api/invitations', { body });
			if (!data) throw new Error(`HTTP ${response.status}`);
			return { ...data, shareUrl: buildShareUrl(data.token) };
		},
		onSuccess: (_data, vars) => {
			if (vars.targetType === 'tenant') {
				void queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY });
			} else {
				void queryClient.invalidateQueries({ queryKey: GUARANTORS_QUERY_KEY });
			}
		},
	});
}
