import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/Modal';
import { Skeleton } from '@/components/Skeleton';
import { toast } from '@/components/Toast';

import { useCreateInvitation } from '@/api/invitations';
import {
	useDeleteTenant,
	useTenants,
	type Tenant,
} from '@/api/tenants';

import { InviteLinkModal } from './InviteLinkModal';
import styles from './LocatairesPage.module.scss';
import { TenantFormModal } from './TenantFormModal';

const formatBirthDate = (iso: string): string => {
	const [y, m, d] = iso.split('-');
	return `${d}/${m}/${y}`;
};

const fullName = (t: Tenant): string =>
	`${t.civility ? `${t.civility} ` : ''}${t.firstName} ${t.lastName}`.trim();

export const LocatairesPage = () => {
	const { t } = useTranslation();
	const tenantsQuery = useTenants();
	const deleteMutation = useDeleteTenant();
	const inviteMutation = useCreateInvitation();

	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Tenant | undefined>(undefined);

	const [confirmDelete, setConfirmDelete] = useState<Tenant | null>(null);

	const [inviteModalOpen, setInviteModalOpen] = useState(false);
	const [invitePayload, setInvitePayload] = useState<{
		shareUrl: string | null;
		expiresAt: string | null;
	}>({ shareUrl: null, expiresAt: null });

	const openCreate = (): void => {
		setEditing(undefined);
		setFormOpen(true);
	};

	const openEdit = (tenant: Tenant): void => {
		setEditing(tenant);
		setFormOpen(true);
	};

	const handleInvite = (tenant: Tenant): void => {
		inviteMutation.mutate(
			{ targetType: 'tenant', targetId: tenant.id },
			{
				onSuccess: (data) => {
					setInvitePayload({ shareUrl: data.shareUrl, expiresAt: data.expiresAt });
					setInviteModalOpen(true);
					toast.success(t('locataires.toast.inviteLinkGenerated'));
				},
			},
		);
	};

	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<h1>{t('locataires.title')}</h1>
				<Button onPress={openCreate}>{t('locataires.addButton')}</Button>
			</header>

			{tenantsQuery.isLoading ? <Skeleton lines={8} /> : null}

			{tenantsQuery.isSuccess && tenantsQuery.data.length === 0 ? (
				<p className={styles.empty}>
					{t('locataires.empty')}
				</p>
			) : null}

			{tenantsQuery.isSuccess && tenantsQuery.data.length > 0 ? (
				<ul className={styles.list}>
					{tenantsQuery.data.map((tenant) => {
						const hasAccount = tenant.userId !== null;
						const isInviting =
							inviteMutation.isPending && inviteMutation.variables?.targetId === tenant.id;
						return (
							<li className={styles.item} key={tenant.id}>
								<div className={styles.itemMain}>
									<div className={styles.itemHeader}>
										<strong>{fullName(tenant)}</strong>
										<span className={styles.email}>({tenant.email})</span>
									</div>
									<div className={styles.itemMeta}>
										{tenant.phone ? (
											<span>{t('locataires.phoneLabel', { phone: tenant.phone })}</span>
										) : null}
										{tenant.birthDate ? (
											<span>
												{t('locataires.birthDateLabel', {
													date: formatBirthDate(tenant.birthDate),
												})}
											</span>
										) : null}
									</div>
									<div className={styles.status}>
										{hasAccount ? (
											<span className={styles.statusOk}>
												{t('locataires.status.accountCreated')}
											</span>
										) : (
											<span className={styles.statusPending}>
												{t('locataires.status.notInvited')}
											</span>
										)}
									</div>
								</div>
								<div className={styles.itemActions}>
									<Button onPress={() => openEdit(tenant)} variant="outlined">
										{t('common.actions.edit')}
									</Button>
									<Button
										isDisabled={hasAccount || isInviting}
										onPress={() => handleInvite(tenant)}
										variant="outlined"
									>
										{hasAccount
											? t('locataires.invite.buttonDone')
											: isInviting
												? t('locataires.invite.buttonPending')
												: t('locataires.invite.button')}
									</Button>
									<Button
										aria-label={t('locataires.deleteAriaLabel', { name: fullName(tenant) })}
										onPress={() => setConfirmDelete(tenant)}
										variant="danger"
									>
										×
									</Button>
								</div>
							</li>
						);
					})}
				</ul>
			) : null}

			<TenantFormModal
				isOpen={formOpen}
				onOpenChange={setFormOpen}
				tenant={editing}
			/>

			<ConfirmDialog
				description={t('locataires.confirmDelete.description')}
				isOpen={confirmDelete !== null}
				isPending={deleteMutation.isPending}
				onConfirm={async () => {
					if (!confirmDelete) return;
					await deleteMutation.mutateAsync(confirmDelete.id);
					toast.success(t('locataires.toast.tenantDeleted'));
					setConfirmDelete(null);
				}}
				onOpenChange={(open) => {
					if (!open) setConfirmDelete(null);
				}}
				title={t('locataires.confirmDelete.title')}
				variant="danger"
			/>

			<InviteLinkModal
				expiresAt={invitePayload.expiresAt}
				isOpen={inviteModalOpen}
				onOpenChange={setInviteModalOpen}
				shareUrl={invitePayload.shareUrl}
			/>
		</div>
	);
};
