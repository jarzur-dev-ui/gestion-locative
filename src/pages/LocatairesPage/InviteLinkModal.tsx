import { useState } from 'react';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { toast } from '@/components/Toast';

import styles from './LocatairesPage.module.scss';

interface InviteLinkModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	shareUrl: string | null;
	expiresAt: string | null;
}

const formatExpiry = (iso: string): string => {
	const d = new Date(iso);
	return new Intl.DateTimeFormat('fr-FR', {
		dateStyle: 'long',
		timeStyle: 'short',
	}).format(d);
};

export const InviteLinkModal = ({
	isOpen,
	onOpenChange,
	shareUrl,
	expiresAt,
}: InviteLinkModalProps) => {
	const [copied, setCopied] = useState(false);

	const onCopy = async (): Promise<void> => {
		if (!shareUrl) return;
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			toast.success('Lien copié dans le presse-papier');
			window.setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error('Impossible de copier le lien — copie-le manuellement.');
		}
	};

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange} title="Lien d'invitation">
			<div className={styles.inviteBody}>
				<p>
					Partage ce lien avec la personne concernée pour qu'elle active son compte
					et accède à son dossier.
				</p>
				{shareUrl ? (
					<div className={styles.shareUrlBox}>
						<code className={styles.shareUrl}>{shareUrl}</code>
					</div>
				) : null}
				{expiresAt ? (
					<p className={styles.muted}>Valide jusqu'au {formatExpiry(expiresAt)}.</p>
				) : null}
				<div className={styles.actions}>
					<Button onPress={() => onOpenChange(false)} variant="ghost">
						Fermer
					</Button>
					<Button
						isDisabled={!shareUrl}
						onPress={() => {
							void onCopy();
						}}
					>
						{copied ? 'Copié ✓' : 'Copier le lien'}
					</Button>
				</div>
			</div>
		</Modal>
	);
};
