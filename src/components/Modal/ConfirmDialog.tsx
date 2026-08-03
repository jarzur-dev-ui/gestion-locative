// Helper de confirmation pour les actions sensibles (suppression, etc.).
//
// Exemple :
//   <ConfirmDialog
//     isOpen={confirmDeleteOpen}
//     onOpenChange={setConfirmDeleteOpen}
//     title="Supprimer ce bail ?"
//     description="Cette action est irréversible. Tous les documents associés seront soft-deleted."
//     variant="danger"
//     onConfirm={() => deleteMutation.mutateAsync(id)}
//     isPending={deleteMutation.isPending}
//   />
//
// - Le bouton "Confirmer" reçoit le focus initial en mode `default`.
// - En mode `danger`, c'est "Annuler" qui reçoit le focus initial (évite le clic accidentel).

import classNames from 'classnames';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';

import type { ConfirmDialogProps } from './ConfirmDialog.types';
import styles from './ConfirmDialog.module.scss';
import { Modal } from './Modal';

export type { ConfirmDialogProps, ConfirmVariant } from './ConfirmDialog.types';

export const ConfirmDialog = ({
	isOpen,
	onOpenChange,
	title,
	description,
	confirmLabel,
	cancelLabel,
	variant = 'default',
	onConfirm,
	isPending = false,
}: ConfirmDialogProps) => {
	const { t } = useTranslation();
	const [internalPending, setInternalPending] = useState(false);
	const busy = isPending || internalPending;
	const isDanger = variant === 'danger';
	const resolvedConfirmLabel = confirmLabel ?? t('common.actions.confirm');
	const resolvedCancelLabel = cancelLabel ?? t('common.actions.cancel');

	const handleConfirm = async (): Promise<void> => {
		if (busy) {
			return;
		}
		try {
			setInternalPending(true);
			await onConfirm();
			onOpenChange(false);
		} finally {
			setInternalPending(false);
		}
	};

	const handleCancel = (): void => {
		if (busy) {
			return;
		}
		onOpenChange(false);
	};

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm" title={title}>
			<div className={styles.body}>
				<p className={styles.description}>{description}</p>
				<div className={styles.actions}>
					<Button
						autoFocus={isDanger}
						disabled={busy}
						onClick={handleCancel}
						variant="outlined"
					>
						{resolvedCancelLabel}
					</Button>
					<Button
						autoFocus={!isDanger}
						className={classNames(isDanger && styles.confirmDanger)}
						disabled={busy}
						onClick={() => {
							void handleConfirm();
						}}
						variant="filled"
					>
						{busy ? t('common.pending') : resolvedConfirmLabel}
					</Button>
				</div>
			</div>
		</Modal>
	);
};
