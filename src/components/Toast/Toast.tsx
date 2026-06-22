/**
 * Toast — implémentation 100% custom (pas de dépendance externe pour la queue).
 *
 * La queue impérative singleton et l'API `toast` vivent dans `./toast-store`.
 * Ce fichier n'expose que des composants React (`ToastProvider`), pour rester
 * compatible avec Fast Refresh.
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
import type { ToastItem, ToastLevel } from './Toast.types';
import { dismissToast, subscribeToToasts } from './toast-store';

const ICONS: Record<ToastLevel, string> = {
	success: '✓',
	error: '⚠',
	info: 'ℹ',
};

// ─── ToastProvider ───────────────────────────────────────────────────────────
export const ToastProvider = () => {
	const [items, setItems] = useState<ToastItem[]>([]);

	useEffect(() => subscribeToToasts(setItems), []);

	if (typeof document === 'undefined') return null;

	return createPortal(
		<div className={styles.region}>
			{/* assertive pour les erreurs, polite pour le reste — on duplique
			    par double region pour respecter les niveaux d'urgence */}
			<div aria-atomic="true" aria-live="polite" className={styles.column}>
				{items
					.filter((i) => i.level !== 'error')
					.map((item) => (
						<ToastView item={item} key={item.id} onDismiss={() => dismissToast(item.id)} />
					))}
			</div>
			<div aria-atomic="true" aria-live="assertive" className={styles.column}>
				{items
					.filter((i) => i.level === 'error')
					.map((item) => (
						<ToastView item={item} key={item.id} onDismiss={() => dismissToast(item.id)} />
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
	const startedAtRef = useRef<number>(0);

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
