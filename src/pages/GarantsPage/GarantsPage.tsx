import { useState } from 'react';

import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/Modal';
import { Skeleton } from '@/components/Skeleton';
import { Tabs } from '@/components/Tabs';
import { toast } from '@/components/Toast';

import { useCreateInvitation } from '@/api/invitations';
import {
	useDeleteGuarantor,
	useGuarantors,
	type Guarantor,
	type GuarantorType,
} from '@/api/guarantors';

import { InviteLinkModal } from '../LocatairesPage/InviteLinkModal';
import { GuarantorFormModal } from './GuarantorFormModal';
import styles from './GarantsPage.module.scss';

const formatBirthDate = (iso: string): string => {
	const [y, m, d] = iso.split('-');
	return `${d}/${m}/${y}`;
};

const guarantorDisplayName = (g: Guarantor): string => {
	if (g.guarantorTypeKey === 'organization') {
		return g.organizationName ?? 'Organisation sans nom';
	}
	const civ = g.civility ? `${g.civility} ` : '';
	const first = g.firstName ?? '';
	const last = g.lastName ?? '';
	return `${civ}${first} ${last}`.trim() || 'Garant';
};

interface GuarantorListProps {
	typeFilter: GuarantorType;
	onEdit: (g: Guarantor) => void;
	onDelete: (g: Guarantor) => void;
	onInvite: (g: Guarantor) => void;
	invitingId: string | undefined;
}

const GuarantorList = ({
	typeFilter,
	onEdit,
	onDelete,
	onInvite,
	invitingId,
}: GuarantorListProps) => {
	const query = useGuarantors(typeFilter);

	if (query.isLoading) {
		return <Skeleton lines={6} />;
	}

	if (query.isSuccess && query.data.length === 0) {
		return (
			<p className={styles.empty}>
				{typeFilter === 'person'
					? "Aucune personne physique. Ajoute un garant pour qu'il puisse être rattaché à un bail."
					: 'Aucune organisation. Ajoute un garant moral (caution solidaire, Visale, etc.).'}
			</p>
		);
	}

	if (!query.isSuccess) return null;

	return (
		<ul className={styles.list}>
			{query.data.map((g) => {
				const isPerson = g.guarantorTypeKey === 'person';
				const hasAccount = g.userId !== null;
				const isInviting = invitingId === g.id;
				return (
					<li className={styles.item} key={g.id}>
						<div className={styles.itemMain}>
							<div className={styles.itemHeader}>
								<strong>{guarantorDisplayName(g)}</strong>
								{g.email ? <span className={styles.email}>({g.email})</span> : null}
							</div>
							<div className={styles.itemMeta}>
								{g.phone ? <span>Tel : {g.phone}</span> : null}
								{isPerson && g.birthDate ? (
									<span>Né(e) : {formatBirthDate(g.birthDate)}</span>
								) : null}
								{!isPerson && g.organizationReference ? (
									<span>Réf : {g.organizationReference}</span>
								) : null}
							</div>
							{isPerson ? (
								<div className={styles.status}>
									{hasAccount ? (
										<span className={styles.statusOk}>✓ Compte créé</span>
									) : (
										<span className={styles.statusPending}>
											⏳ Pas encore invité(e)
										</span>
									)}
								</div>
							) : null}
						</div>
						<div className={styles.itemActions}>
							<Button onPress={() => onEdit(g)} variant="outlined">
								Modifier
							</Button>
							{isPerson ? (
								<Button
									isDisabled={hasAccount || isInviting}
									onPress={() => onInvite(g)}
									variant="outlined"
								>
									{hasAccount ? 'Compte créé' : isInviting ? '…' : 'Inviter'}
								</Button>
							) : null}
							<Button
								aria-label={`Supprimer ${guarantorDisplayName(g)}`}
								onPress={() => onDelete(g)}
								variant="danger"
							>
								×
							</Button>
						</div>
					</li>
				);
			})}
		</ul>
	);
};

export const GarantsPage = () => {
	// On précharge le compte des deux types pour les libellés de tabs.
	const personsQuery = useGuarantors('person');
	const orgsQuery = useGuarantors('organization');

	const deleteMutation = useDeleteGuarantor();
	const inviteMutation = useCreateInvitation();

	const [activeTab, setActiveTab] = useState<GuarantorType>('person');

	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Guarantor | undefined>(undefined);

	const [confirmDelete, setConfirmDelete] = useState<Guarantor | null>(null);

	const [inviteModalOpen, setInviteModalOpen] = useState(false);
	const [invitePayload, setInvitePayload] = useState<{
		shareUrl: string | null;
		expiresAt: string | null;
	}>({ shareUrl: null, expiresAt: null });

	const openCreate = (): void => {
		setEditing(undefined);
		setFormOpen(true);
	};

	const openEdit = (g: Guarantor): void => {
		setEditing(g);
		setFormOpen(true);
	};

	const handleInvite = (g: Guarantor): void => {
		// Garde-fou : les organisations ne sont jamais "invitées" (pas de connexion).
		if (g.guarantorTypeKey !== 'person') return;
		inviteMutation.mutate(
			{ targetType: 'guarantor', targetId: g.id },
			{
				onSuccess: (data) => {
					setInvitePayload({ shareUrl: data.shareUrl, expiresAt: data.expiresAt });
					setInviteModalOpen(true);
					toast.success("Lien d'invitation généré (valide 7 jours)");
				},
			},
		);
	};

	const personsCount = personsQuery.data?.length ?? 0;
	const orgsCount = orgsQuery.data?.length ?? 0;

	const invitingId =
		inviteMutation.isPending && inviteMutation.variables?.targetType === 'guarantor'
			? inviteMutation.variables.targetId
			: undefined;

	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<h1>Mes garants</h1>
				<Button onPress={openCreate}>+ Ajouter un garant</Button>
			</header>

			<Tabs
				onSelectionChange={(key) => setActiveTab(key as GuarantorType)}
				selectedKey={activeTab}
				tabs={[
					{
						key: 'person',
						label: `Personnes physiques (${personsCount})`,
						panel: (
							<GuarantorList
								invitingId={invitingId}
								onDelete={setConfirmDelete}
								onEdit={openEdit}
								onInvite={handleInvite}
								typeFilter="person"
							/>
						),
					},
					{
						key: 'organization',
						label: `Organisations (${orgsCount})`,
						panel: (
							<GuarantorList
								invitingId={invitingId}
								onDelete={setConfirmDelete}
								onEdit={openEdit}
								onInvite={handleInvite}
								typeFilter="organization"
							/>
						),
					},
				]}
			/>

			<GuarantorFormModal
				guarantor={editing}
				initialType={activeTab}
				isOpen={formOpen}
				onOpenChange={setFormOpen}
			/>

			<ConfirmDialog
				description="Supprimer ce garant ? Action irréversible."
				isOpen={confirmDelete !== null}
				isPending={deleteMutation.isPending}
				onConfirm={async () => {
					if (!confirmDelete) return;
					await deleteMutation.mutateAsync(confirmDelete.id);
					toast.success('Garant supprimé');
					setConfirmDelete(null);
				}}
				onOpenChange={(open) => {
					if (!open) setConfirmDelete(null);
				}}
				title="Supprimer ce garant ?"
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
