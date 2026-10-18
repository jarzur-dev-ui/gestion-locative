/**
 * Toast — queue impérative singleton (module-level).
 *
 * Séparée de `Toast.tsx` pour que ce dernier n'exporte que des composants
 * (contrainte react-refresh / Fast Refresh).
 *
 * Utilisation côté composant React :
 *   import { toast } from '@/components/Toast';
 *   toast.success('Bien enregistré ✓');
 *   toast.error('Impossible de supprimer ce bail');
 *
 * Utilisation hors React (par ex. dans `query-client.ts`) :
 *   import { toast } from '@/components/Toast';
 *   // l'API est la même : c'est une queue impérative singleton
 */
import type { ToastItem, ToastLevel, ToastOptions } from './Toast.types';

const DEFAULT_DURATION: Record<ToastLevel, number> = {
	success: 4000,
	info: 4000,
	error: 6000,
};

const MAX_VISIBLE = 5;

type Listener = (toasts: ToastItem[]) => void;

let nextId = 1;
let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit(): void {
	for (const listener of listeners) listener(toasts);
}

function push(level: ToastLevel, message: string, options?: ToastOptions): void {
	const item: ToastItem = {
		id: nextId++,
		level,
		message,
		duration: options?.duration ?? DEFAULT_DURATION[level],
	};
	toasts = [...toasts, item].slice(-MAX_VISIBLE);
	emit();
}

export function dismissToast(id: number): void {
	toasts = toasts.filter((t) => t.id !== id);
	emit();
}

/** S'abonne aux changements de la queue. Renvoie une fonction de désabonnement. */
export function subscribeToToasts(listener: Listener): () => void {
	listeners.add(listener);
	listener(toasts);
	return () => {
		listeners.delete(listener);
	};
}

// ─── API impérative exportée ─────────────────────────────────────────────────
export const toast = {
	success: (message: string, options?: ToastOptions) => push('success', message, options),
	error: (message: string, options?: ToastOptions) => push('error', message, options),
	info: (message: string, options?: ToastOptions) => push('info', message, options),
};
