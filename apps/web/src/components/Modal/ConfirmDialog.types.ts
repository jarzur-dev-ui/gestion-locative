export type ConfirmVariant = 'default' | 'danger';

export interface ConfirmDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	/** Texte du bouton de confirmation. Default: "Confirmer". */
	confirmLabel?: string;
	/** Texte du bouton d'annulation. Default: "Annuler". */
	cancelLabel?: string;
	/**
	 * 'default' = bouton confirm en variant filled.
	 * 'danger'  = bouton confirm rouge + focus initial sur "Annuler" (anti-misclick).
	 */
	variant?: ConfirmVariant;
	/**
	 * Si retourne une Promise, le composant gère automatiquement le pending state
	 * (boutons disabled + "…en cours"). La modal se ferme à la résolution.
	 */
	onConfirm: () => void | Promise<void>;
	/** Force l'état pending depuis l'extérieur (cf. mutation.isPending). */
	isPending?: boolean;
}
