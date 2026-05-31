import { useState } from 'react';

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
					toast.success("Lien d'invitation généré (valide 7 jours)");
				},
			},
		);
	};

	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<h1>Mes locataires</h1>
				<Button onPress={openCreate}>+ Ajouter un locataire</Button>
			</header>

			{tenantsQuery.isLoading ? <Skeleton lines={8} /> : null}

			{tenantsQuery.isSuccess && tenantsQuery.data.length === 0 ? (
				<p className={styles.empty}>
					Aucun locataire. Ajoute-en un pour pouvoir créer un bail.
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
										{tenant.phone ? <span>Tel : {tenant.phone}</span> : null}
										{tenant.birthDate ? (
											<span>Né(e) : {formatBirthDate(tenant.birthDate)}</span>
										) : null}
									</div>
									<div className={styles.status}>
										{hasAccount ? (
											<span className={styles.statusOk}>✓ Compte créé</span>
										) : (
											<span className={styles.statusPending}>
												⏳ Pas encore invité(e)
											</span>
										)}
									</div>
								</div>
								<div className={styles.itemActions}>
									<Button onPress={() => openEdit(tenant)} variant="outlined">
										Modifier
									</Button>
									<Button
										isDisabled={hasAccount || isInviting}
										onPress={() => handleInvite(tenant)}
										variant="outlined"
									>
										{hasAccount ? 'Compte créé' : isInviting ? '…' : 'Inviter'}
									</Button>
									<Button
										aria-label={`Supprimer ${fullName(tenant)}`}
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
				description="Supprimer ce locataire ? Action irréversible."
				isOpen={confirmDelete !== null}
				isPending={deleteMutation.isPending}
				onConfirm={async () => {
					if (!confirmDelete) return;
					await deleteMutation.mutateAsync(confirmDelete.id);
					toast.success('Locataire supprimé');
					setConfirmDelete(null);
				}}
				onOpenChange={(open) => {
					if (!open) setConfirmDelete(null);
				}}
				title="Supprimer ce locataire ?"
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
