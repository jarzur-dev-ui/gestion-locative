export type ToastLevel = 'success' | 'error' | 'info';

export interface ToastOptions {
	/** Durée d'affichage en ms. Par défaut : 4000 (success/info) ou 6000 (error). */
	duration?: number;
}

export interface ToastItem {
	id: number;
	level: ToastLevel;
	message: string;
	duration: number;
}
