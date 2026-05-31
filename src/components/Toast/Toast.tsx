/**
 * Toast — implémentation 100% custom (pas de dépendance externe pour la queue).
 *
 * Utilisation côté composant React :
 *   import { toast } from '@/components/Toast';
 *   toast.success('Bien enregistré ✓');
 *   toast.error('Impossible de supprimer ce bail');
 *
 * Utilisation hors React (par ex. dans `query-client.ts`) :
 *   import { toast } from '@/components/Toast';
 *   // l'API est la même : c'est une queue impérative singleton
 *
 * Le `<ToastProvider />` doit être monté UNE seule fois à la racine de l'app.
 *
 * Pourquoi pas react-aria-components ? Sa Toast API était encore UNSTABLE_ en 1.18 ;
 * on évite cette instabilité en pré-prod. ~80 lignes maison, accessible via `aria-live`.
 */
import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import styles from './Toast.module.scss';
import type { ToastItem, ToastLevel, ToastOptions } from './Toast.types';

const DEFAULT_DURATION: Record<ToastLevel, number> = {
	success: 4000,
	info: 4000,
	error: 6000,
};

const MAX_VISIBLE = 5;

const ICONS: Record<ToastLevel, string> = {
	success: '✓',
	error: '⚠',
	info: 'ℹ',
};

// ─── Queue singleton (module-level) ──────────────────────────────────────────
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

function dismiss(id: number): void {
	toasts = toasts.filter((t) => t.id !== id);
	emit();
}

// ─── API impérative exportée ─────────────────────────────────────────────────
export const toast = {
	success: (message: string, options?: ToastOptions) => push('success', message, options),
	error: (message: string, options?: ToastOptions) => push('error', message, options),
	info: (message: string, options?: ToastOptions) => push('info', message, options),
};

// ─── ToastProvider ───────────────────────────────────────────────────────────
export const ToastProvider = () => {
	const [items, setItems] = useState<ToastItem[]>([]);

	useEffect(() => {
		const listener: Listener = (next) => setItems(next);
		listeners.add(listener);
		listener(toasts);
		return () => {
			listeners.delete(listener);
		};
	}, []);

	if (typeof document === 'undefined') return null;

	return createPortal(
		<div className={styles.region}>
			{/* assertive pour les erreurs, polite pour le reste — on duplique
			    par double region pour respecter les niveaux d'urgence */}
			<div aria-atomic="true" aria-live="polite" className={styles.column}>
				{items
					.filter((i) => i.level !== 'error')
					.map((item) => (
						<ToastView item={item} key={item.id} onDismiss={() => dismiss(item.id)} />
					))}
			</div>
			<div aria-atomic="true" aria-live="assertive" className={styles.column}>
				{items
					.filter((i) => i.level === 'error')
					.map((item) => (
						<ToastView item={item} key={item.id} onDismiss={() => dismiss(item.id)} />
					))}
			</div>
		</div>,
		document.body,
	);
};

// ─── ToastView ───────────────────────────────────────────────────────────────
interface ToastViewProps {
	item: ToastItem;
	onDismiss: () => void;
}

const ToastView = ({ item, onDismiss }: ToastViewProps) => {
	const [paused, setPaused] = useState(false);
	const remainingRef = useRef(item.duration);
	const startedAtRef = useRef(Date.now());

	useEffect(() => {
		if (paused) {
			remainingRef.current -= Date.now() - startedAtRef.current;
			return;
		}
		startedAtRef.current = Date.now();
		const t = window.setTimeout(onDismiss, remainingRef.current);
		return () => window.clearTimeout(t);
	}, [paused, onDismiss]);

	return (
		<div
			className={classNames(styles.toast, styles[item.level])}
			onMouseEnter={() => setPaused(true)}
			onMouseLeave={() => setPaused(false)}
			role={item.level === 'error' ? 'alert' : 'status'}
		>
			<span className={styles.icon}>{ICONS[item.level]}</span>
			<span className={styles.message}>{item.message}</span>
			<button
				aria-label="Fermer la notification"
				className={styles.close}
				onClick={onDismiss}
				type="button"
			>
				×
			</button>
		</div>
	);
};
