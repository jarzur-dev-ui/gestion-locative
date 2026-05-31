import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import {
	useCreateProperty,
	useDeleteProperty,
	useProperties,
	type CreateProperty,
	type Property,
} from '@/api/properties';
import { useLeases, type Lease } from '@/api/leases';
import { Button } from '@/components/Button';
import { ConfirmDialog, Modal } from '@/components/Modal';
import { SelectField } from '@/components/SelectField';
import { Skeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { toast } from '@/components/Toast';

import styles from './BiensPage.module.scss';

/**
 * Liste des types de bien proposés à la création — `propertyTypeKey` est
 * stockée comme une simple `string` côté back (i18n key) ; cette liste sert
 * juste à offrir un choix prévisible dans le sélecteur du Modal.
 */
const PROPERTY_TYPE_OPTIONS = [
	'apartment',
	'house',
	'studio',
	'parking',
	'storage',
	'commercial',
] as const;

const PROPERTY_TYPE_LABELS: Record<string, string> = {
	apartment: 'Appartement',
	house: 'Maison',
	studio: 'Studio',
	parking: 'Parking',
	storage: 'Cave / Box',
	commercial: 'Local commercial',
};

const DPE_OPTIONS = ['—', 'A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
const FURNISHED_OPTIONS = ['Non meublé', 'Meublé'] as const;

const LEASE_STATUS_LABEL: Record<Lease['statusKey'], string> = {
	draft: 'Brouillon',
	active: 'Actif',
	ended: 'Terminé',
};

interface PropertyFormState {
	addressLine: string;
	postalCode: string;
	city: string;
	propertyTypeKey: string;
	surfaceM2: string;
	roomCount: string;
	dpeGrade: string;
	furnished: string;
}

const EMPTY_PROPERTY_FORM: PropertyFormState = {
	addressLine: '',
	postalCode: '',
	city: '',
	propertyTypeKey: 'apartment',
	surfaceM2: '',
	roomCount: '',
	dpeGrade: '—',
	furnished: 'Non meublé',
};

function isPropertyFormValid(form: PropertyFormState): boolean {
	return (
		form.addressLine.trim() !== '' &&
		form.postalCode.trim() !== '' &&
		form.city.trim() !== '' &&
		form.propertyTypeKey.trim() !== ''
	);
}

function toCreateProperty(form: PropertyFormState): CreateProperty {
	const payload: CreateProperty = {
		addressLine: form.addressLine.trim(),
		postalCode: form.postalCode.trim(),
		city: form.city.trim(),
		propertyTypeKey: form.propertyTypeKey,
		furnished: form.furnished === 'Meublé',
	};
	const surface = parseFloat(form.surfaceM2);
	if (Number.isFinite(surface) && surface > 0) payload.surfaceM2 = surface;
	const rooms = parseInt(form.roomCount, 10);
	if (Number.isFinite(rooms) && rooms > 0) payload.roomCount = rooms;
	if (form.dpeGrade !== '—' && /^[A-G]$/.test(form.dpeGrade)) {
		payload.dpeGrade = form.dpeGrade as CreateProperty['dpeGrade'];
	}
	return payload;
}

function formatPropertyTitle(p: Property): string {
	return `${p.addressLine}, ${p.postalCode} ${p.city}`;
}

function formatPropertyMeta(p: Property): string {
	const parts: string[] = [
		PROPERTY_TYPE_LABELS[p.propertyTypeKey] ?? p.propertyTypeKey,
	];
	if (p.surfaceM2 != null) parts.push(`${p.surfaceM2} m²`);
	if (p.roomCount != null) {
		parts.push(`${p.roomCount} pièce${p.roomCount > 1 ? 's' : ''}`);
	}
	if (p.dpeGrade) parts.push(`DPE ${p.dpeGrade}`);
	if (p.furnished) parts.push('Meublé');
	return parts.join(' · ');
}

function formatTenants(lease: Lease): string {
	if (lease.tenants.length === 0) return 'Aucun locataire';
	return lease.tenants
		.map((t) => `${t.firstName} ${t.lastName}`.trim() || t.email)
		.join(', ');
}

function formatLeaseRange(lease: Lease): string {
	const start = lease.startDate;
	const end = lease.endDate;
	if (start && end) return `du ${formatIsoDateFr(start)} au ${formatIsoDateFr(end)}`;
	if (start) return `depuis le ${formatIsoDateFr(start)}`;
	return '';
}

function formatIsoDateFr(iso: string): string {
	const [y, m, d] = iso.split('-');
	if (!y || !m || !d) return iso;
	return `${d}/${m}/${y}`;
}

export const BiensPage = () => {
	const navigate = useNavigate();
	const propertiesQuery = useProperties();
	const leasesQuery = useLeases();
	const createProperty = useCreateProperty();
	const deleteProperty = useDeleteProperty();

	const [isCreateOpen, setCreateOpen] = useState(false);
	const [propertyForm, setPropertyForm] = useState<PropertyFormState>(
		EMPTY_PROPERTY_FORM,
	);
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	// Index baux par propertyId pour O(1) lookup en rendu — recalculé seulement
	// quand la liste change (refetch, mutation invalidée).
	const leasesByProperty = useMemo(() => {
		const map = new Map<string, Lease[]>();
		for (const lease of leasesQuery.data ?? []) {
			const list = map.get(lease.propertyId) ?? [];
			list.push(lease);
			map.set(lease.propertyId, list);
		}
		return map;
	}, [leasesQuery.data]);

	const isLoading = propertiesQuery.isLoading || leasesQuery.isLoading;
	const properties = propertiesQuery.data ?? [];

	const setPropertyField = <K extends keyof PropertyFormState>(
		key: K,
		value: PropertyFormState[K],
	) => {
		setPropertyForm((prev) => ({ ...prev, [key]: value }));
	};

	const resetPropertyForm = (): void => {
		setPropertyForm(EMPTY_PROPERTY_FORM);
	};

	const onSubmitProperty = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		if (!isPropertyFormValid(propertyForm) || createProperty.isPending) return;
		createProperty.mutate(toCreateProperty(propertyForm), {
			onSuccess: () => {
				toast.success('Bien créé ✓');
				setCreateOpen(false);
				resetPropertyForm();
			},
		});
	};

	const confirmDelete = async (): Promise<void> => {
		if (!confirmDeleteId) return;
		// mutateAsync rethrow l'erreur → ConfirmDialog garde la modal ouverte.
		// Le toast d'erreur est piloté par le global handler dans query-client.ts.
		await deleteProperty.mutateAsync(confirmDeleteId);
		toast.success('Bien supprimé');
		setConfirmDeleteId(null);
	};

	if (isLoading) {
		return (
			<div className={styles.page}>
				<h1>Mes biens</h1>
				<Skeleton lines={8} />
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<h1>Mes biens</h1>
				<Button onPress={() => setCreateOpen(true)}>+ Ajouter un bien</Button>
			</header>

			{properties.length === 0 ? (
				<p className={styles.empty}>
					Aucun bien. Commence par en créer un.
				</p>
			) : (
				properties.map((property) => {
					const leases = leasesByProperty.get(property.id) ?? [];
					return (
						<article className={styles.propertyCard} key={property.id}>
							<div className={styles.propertyHead}>
								<div>
									<h2 className={styles.propertyTitle}>
										{formatPropertyTitle(property)}
									</h2>
									<p className={styles.propertyMeta}>
										{formatPropertyMeta(property)}
									</p>
								</div>
								<div className={styles.propertyActions}>
									<Button
										onPress={() => setConfirmDeleteId(property.id)}
										variant="ghost"
									>
										Supprimer
									</Button>
								</div>
							</div>

							{leases.length === 0 ? (
								<p className={styles.leaseEmpty}>
									Aucun bail pour ce bien.
								</p>
							) : (
								<ul className={styles.leaseList}>
									{leases.map((lease) => (
										<li className={styles.leaseItem} key={lease.id}>
											<button
												className={styles.leaseButton}
												onClick={() =>
													navigate(
														`/biens/${property.id}/baux/${lease.id}`,
													)
												}
												type="button"
											>
												<div className={styles.leaseInfo}>
													<span className={styles.leaseTenants}>
														Bail — {formatTenants(lease)}
													</span>
													<span className={styles.leaseSub}>
														{formatLeaseRange(lease)}
													</span>
												</div>
											</button>
											<span
												className={`${styles.leaseStatus} ${
													lease.statusKey === 'active'
														? styles.statusActive
														: lease.statusKey === 'ended'
															? styles.statusEnded
															: styles.statusDraft
												}`}
											>
												{LEASE_STATUS_LABEL[lease.statusKey]}
											</span>
										</li>
									))}
								</ul>
							)}

							<div className={styles.leaseFooter}>
								<Button
									onPress={() =>
										navigate(`/biens/${property.id}/baux/nouveau`)
									}
									variant="outlined"
								>
									+ Nouveau bail
								</Button>
							</div>
						</article>
					);
				})
			)}

			<Modal
				isOpen={isCreateOpen}
				onOpenChange={(open) => {
					setCreateOpen(open);
					if (!open) resetPropertyForm();
				}}
				size="md"
				title="Ajouter un bien"
			>
				<form className={styles.modalForm} onSubmit={onSubmitProperty}>
					<TextField
						label="Adresse"
						onChange={(e) => setPropertyField('addressLine', e.target.value)}
						required
						value={propertyForm.addressLine}
					/>
					<div className={styles.modalGrid}>
						<TextField
							label="Code postal"
							onChange={(e) => setPropertyField('postalCode', e.target.value)}
							required
							value={propertyForm.postalCode}
						/>
						<TextField
							label="Ville"
							onChange={(e) => setPropertyField('city', e.target.value)}
							required
							value={propertyForm.city}
						/>
					</div>
					<div className={styles.modalGrid}>
						<SelectField
							label="Type de bien"
							onChange={(e) =>
								setPropertyField('propertyTypeKey', e.target.value)
							}
							options={PROPERTY_TYPE_OPTIONS}
							value={propertyForm.propertyTypeKey}
						/>
						<SelectField
							label="Meublé"
							onChange={(e) => setPropertyField('furnished', e.target.value)}
							options={FURNISHED_OPTIONS}
							value={propertyForm.furnished}
						/>
					</div>
					<div className={styles.modalGrid}>
						<TextField
							label="Surface (m²)"
							min={0}
							onChange={(e) => setPropertyField('surfaceM2', e.target.value)}
							type="number"
							value={propertyForm.surfaceM2}
						/>
						<TextField
							label="Nombre de pièces"
							min={0}
							onChange={(e) => setPropertyField('roomCount', e.target.value)}
							type="number"
							value={propertyForm.roomCount}
						/>
					</div>
					<SelectField
						label="DPE"
						onChange={(e) => setPropertyField('dpeGrade', e.target.value)}
						options={DPE_OPTIONS}
						value={propertyForm.dpeGrade}
					/>

					<div className={styles.modalActions}>
						<Button
							onPress={() => setCreateOpen(false)}
							variant="ghost"
						>
							Annuler
						</Button>
						<Button
							isDisabled={
								!isPropertyFormValid(propertyForm) || createProperty.isPending
							}
							type="submit"
						>
							{createProperty.isPending ? 'Création…' : 'Créer le bien'}
						</Button>
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				description="Cette action est définitive. Si un bail actif est rattaché, la suppression sera refusée par le serveur."
				isOpen={confirmDeleteId !== null}
				isPending={deleteProperty.isPending}
				onConfirm={confirmDelete}
				onOpenChange={(open) => {
					if (!open) setConfirmDeleteId(null);
				}}
				title="Supprimer ce bien ?"
				variant="danger"
			/>
		</div>
	);
};
