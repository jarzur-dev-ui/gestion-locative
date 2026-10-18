import type { TFunction } from 'i18next';
import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/config/routes';

import {
	useCreateProperty,
	useDeleteProperty,
	usePatchProperty,
	useProperties,
	type CreateProperty,
	type PatchProperty,
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

const DPE_OPTIONS = ['—', 'A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
const FURNISHED_VALUES = ['unfurnished', 'furnished'] as const;

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
	furnished: 'unfurnished',
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
		furnished: form.furnished === 'furnished',
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

function propertyToForm(p: Property): PropertyFormState {
	return {
		addressLine: p.addressLine,
		postalCode: p.postalCode,
		city: p.city,
		propertyTypeKey: p.propertyTypeKey,
		surfaceM2: p.surfaceM2 != null ? String(p.surfaceM2) : '',
		roomCount: p.roomCount != null ? String(p.roomCount) : '',
		dpeGrade: p.dpeGrade ?? '—',
		furnished: p.furnished ? 'furnished' : 'unfurnished',
	};
}

// Merge Patch : les champs optionnels vidés sont renvoyés à `null` pour les effacer.
function toPatchProperty(form: PropertyFormState): PatchProperty {
	const surface = parseFloat(form.surfaceM2);
	const rooms = parseInt(form.roomCount, 10);
	return {
		addressLine: form.addressLine.trim(),
		postalCode: form.postalCode.trim(),
		city: form.city.trim(),
		propertyTypeKey: form.propertyTypeKey,
		furnished: form.furnished === 'furnished',
		surfaceM2: Number.isFinite(surface) && surface > 0 ? surface : null,
		roomCount: Number.isFinite(rooms) && rooms > 0 ? rooms : null,
		dpeGrade:
			form.dpeGrade !== '—' && /^[A-G]$/.test(form.dpeGrade)
				? (form.dpeGrade as PatchProperty['dpeGrade'])
				: null,
	};
}

function formatPropertyTitle(p: Property): string {
	return `${p.addressLine}, ${p.postalCode} ${p.city}`;
}

function formatPropertyMeta(p: Property, t: TFunction): string {
	// propertyTypeKey is an untyped string from the back, not a literal union — cast needed for t().
	const parts: string[] = [t(`domain.propertyType.${p.propertyTypeKey}` as never)];
	if (p.surfaceM2 != null) {
		parts.push(t('properties.surfaceValue', { value: p.surfaceM2 }));
	}
	if (p.roomCount != null) {
		parts.push(t('properties.roomCount', { count: p.roomCount }));
	}
	if (p.dpeGrade) parts.push(t('properties.dpeLabel', { grade: p.dpeGrade }));
	if (p.furnished) parts.push(t('domain.furnished.furnished'));
	return parts.join(' · ');
}

function formatTenants(lease: Lease, t: TFunction): string {
	if (lease.tenants.length === 0) return t('properties.noTenants');
	return lease.tenants
		.map((tenant) => `${tenant.firstName} ${tenant.lastName}`.trim() || tenant.email)
		.join(', ');
}

function formatLeaseRange(lease: Lease, t: TFunction): string {
	const start = lease.startDate;
	const end = lease.endDate;
	if (start && end) {
		return t('properties.leaseRange.fromTo', {
			start: formatIsoDateFr(start),
			end: formatIsoDateFr(end),
		});
	}
	if (start) {
		return t('properties.leaseRange.since', { start: formatIsoDateFr(start) });
	}
	return '';
}

function formatIsoDateFr(iso: string): string {
	const [y, m, d] = iso.split('-');
	if (!y || !m || !d) return iso;
	return `${d}/${m}/${y}`;
}

export const BiensPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const propertiesQuery = useProperties();
	const leasesQuery = useLeases();
	const createProperty = useCreateProperty();
	const patchProperty = usePatchProperty();
	const deleteProperty = useDeleteProperty();

	const [isFormOpen, setFormOpen] = useState(false);
	// null = création ; sinon id du bien en cours d'édition.
	const [editingId, setEditingId] = useState<string | null>(null);
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

	const propertyTypeSelectOptions = useMemo(
		() =>
			PROPERTY_TYPE_OPTIONS.map((key) => ({
				value: key,
				label: t(`domain.propertyType.${key}` as never),
			})),
		[t],
	);
	const furnishedSelectOptions = useMemo(
		() =>
			FURNISHED_VALUES.map((key) => ({
				value: key,
				label: t(`domain.furnished.${key}` as never),
			})),
		[t],
	);
	const dpeSelectOptions = useMemo(
		() =>
			DPE_OPTIONS.map((grade) => ({
				value: grade,
				label: grade === '—' ? t('domain.dpe.none') : grade,
			})),
		[t],
	);

	const setPropertyField = <K extends keyof PropertyFormState>(
		key: K,
		value: PropertyFormState[K],
	) => {
		setPropertyForm((prev) => ({ ...prev, [key]: value }));
	};

	const resetPropertyForm = (): void => {
		setPropertyForm(EMPTY_PROPERTY_FORM);
		setEditingId(null);
	};

	const openCreate = (): void => {
		resetPropertyForm();
		setFormOpen(true);
	};

	const openEdit = (property: Property): void => {
		setPropertyForm(propertyToForm(property));
		setEditingId(property.id);
		setFormOpen(true);
	};

	const isSubmitting = createProperty.isPending || patchProperty.isPending;

	const onSubmitProperty = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		if (!isPropertyFormValid(propertyForm) || isSubmitting) return;
		const onSuccess = (): void => {
			toast.success(editingId ? t('properties.toast.updated') : t('properties.toast.created'));
			setFormOpen(false);
			resetPropertyForm();
		};
		if (editingId) {
			patchProperty.mutate({ id: editingId, body: toPatchProperty(propertyForm) }, { onSuccess });
		} else {
			createProperty.mutate(toCreateProperty(propertyForm), { onSuccess });
		}
	};

	const confirmDelete = async (): Promise<void> => {
		if (!confirmDeleteId) return;
		// mutateAsync rethrow l'erreur → ConfirmDialog garde la modal ouverte.
		// Le toast d'erreur est piloté par le global handler dans query-client.ts.
		await deleteProperty.mutateAsync(confirmDeleteId);
		toast.success(t('properties.toast.deleted'));
		setConfirmDeleteId(null);
	};

	if (isLoading) {
		return (
			<div className={styles.page}>
				<h1>{t('properties.title')}</h1>
				<Skeleton lines={8} />
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<h1>{t('properties.title')}</h1>
				<Button onPress={openCreate}>
					{'+ '}
					{t('properties.addButton')}
				</Button>
			</header>

			{properties.length === 0 ? (
				<p className={styles.empty}>{t('properties.empty')}</p>
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
										{formatPropertyMeta(property, t)}
									</p>
								</div>
								<div className={styles.propertyActions}>
									<Button
										onPress={() => openEdit(property)}
										variant="outlined"
									>
										{t('common.actions.edit')}
									</Button>
									<Button
										onPress={() => setConfirmDeleteId(property.id)}
										variant="ghost"
									>
										{t('common.actions.delete')}
									</Button>
								</div>
							</div>

							{leases.length === 0 ? (
								<p className={styles.leaseEmpty}>{t('properties.leaseEmpty')}</p>
							) : (
								<ul className={styles.leaseList}>
									{leases.map((lease) => (
										<li className={styles.leaseItem} key={lease.id}>
											<button
												className={styles.leaseButton}
												onClick={() =>
													navigate(
														paths.leaseEdit(property.id, lease.id),
													)
												}
												type="button"
											>
												<div className={styles.leaseInfo}>
													<span className={styles.leaseTenants}>
														{t('properties.leaseLabel', {
															tenants: formatTenants(lease, t),
														})}
													</span>
													<span className={styles.leaseSub}>
														{formatLeaseRange(lease, t)}
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
												{t(`domain.leaseStatus.${lease.statusKey}` as never)}
											</span>
										</li>
									))}
								</ul>
							)}

							<div className={styles.leaseFooter}>
								<Button
									onPress={() =>
										navigate(paths.leaseNew(property.id))
									}
									variant="outlined"
								>
									{'+ '}
									{t('properties.newLeaseButton')}
								</Button>
							</div>
						</article>
					);
				})
			)}

			<Modal
				isOpen={isFormOpen}
				onOpenChange={(open) => {
					setFormOpen(open);
					if (!open) resetPropertyForm();
				}}
				size="md"
				title={editingId ? t('properties.editModalTitle') : t('properties.modalTitle')}
			>
				<form className={styles.modalForm} onSubmit={onSubmitProperty}>
					<TextField
						label={t('properties.form.address')}
						onChange={(e) => setPropertyField('addressLine', e.target.value)}
						required
						value={propertyForm.addressLine}
					/>
					<div className={styles.modalGrid}>
						<TextField
							label={t('properties.form.postalCode')}
							onChange={(e) => setPropertyField('postalCode', e.target.value)}
							required
							value={propertyForm.postalCode}
						/>
						<TextField
							label={t('properties.form.city')}
							onChange={(e) => setPropertyField('city', e.target.value)}
							required
							value={propertyForm.city}
						/>
					</div>
					<div className={styles.modalGrid}>
						<SelectField
							label={t('properties.form.propertyType')}
							onChange={(e) =>
								setPropertyField('propertyTypeKey', e.target.value)
							}
							options={propertyTypeSelectOptions}
							value={propertyForm.propertyTypeKey}
						/>
						<SelectField
							label={t('properties.form.furnished')}
							onChange={(e) => setPropertyField('furnished', e.target.value)}
							options={furnishedSelectOptions}
							value={propertyForm.furnished}
						/>
					</div>
					<div className={styles.modalGrid}>
						<TextField
							label={t('properties.form.surface')}
							min={0}
							onChange={(e) => setPropertyField('surfaceM2', e.target.value)}
							type="number"
							value={propertyForm.surfaceM2}
						/>
						<TextField
							label={t('properties.form.roomCount')}
							min={0}
							onChange={(e) => setPropertyField('roomCount', e.target.value)}
							type="number"
							value={propertyForm.roomCount}
						/>
					</div>
					<SelectField
						label={t('properties.form.dpe')}
						onChange={(e) => setPropertyField('dpeGrade', e.target.value)}
						options={dpeSelectOptions}
						value={propertyForm.dpeGrade}
					/>

					<div className={styles.modalActions}>
						<Button
							onPress={() => setFormOpen(false)}
							variant="ghost"
						>
							{t('common.actions.cancel')}
						</Button>
						<Button
							isDisabled={!isPropertyFormValid(propertyForm) || isSubmitting}
							type="submit"
						>
							{isSubmitting
								? t('properties.form.submitting')
								: editingId
									? t('common.actions.save')
									: t('properties.form.submit')}
						</Button>
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				description={t('properties.deleteConfirm.description')}
				isOpen={confirmDeleteId !== null}
				isPending={deleteProperty.isPending}
				onConfirm={confirmDelete}
				onOpenChange={(open) => {
					if (!open) setConfirmDeleteId(null);
				}}
				title={t('properties.deleteConfirm.title')}
				variant="danger"
			/>
		</div>
	);
};
