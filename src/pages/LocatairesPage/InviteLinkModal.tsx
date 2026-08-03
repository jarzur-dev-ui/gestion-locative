import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
	const { t } = useTranslation();
	const [copied, setCopied] = useState(false);

	const onCopy = async (): Promise<void> => {
		if (!shareUrl) return;
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			toast.success(t('tenants.toast.linkCopied'));
			window.setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error(t('tenants.toast.copyFailed'));
		}
	};

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange} title={t('tenants.invite.modalTitle')}>
			<div className={styles.inviteBody}>
				<p>{t('tenants.invite.description')}</p>
				{shareUrl ? (
					<div className={styles.shareUrlBox}>
						<code className={styles.shareUrl}>{shareUrl}</code>
					</div>
				) : null}
				{expiresAt ? (
					<p className={styles.muted}>
						{t('tenants.invite.expiresUntil', { date: formatExpiry(expiresAt) })}
					</p>
				) : null}
				<div className={styles.actions}>
					<Button onPress={() => onOpenChange(false)} variant="ghost">
						{t('common.actions.close')}
					</Button>
					<Button
						isDisabled={!shareUrl}
						onPress={() => {
							void onCopy();
						}}
					>
						{copied ? t('tenants.invite.copyButtonDone') : t('tenants.invite.copyButton')}
					</Button>
				</div>
			</div>
		</Modal>
	);
};
