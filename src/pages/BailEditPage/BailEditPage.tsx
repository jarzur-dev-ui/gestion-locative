import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { components } from '@/api/client';
import { useGuarantors } from '@/api/guarantors';
import {
	useChangeLeaseStatus,
	useCreateLease,
	useDeleteLease,
	useLease,
	usePatchLease,
} from '@/api/leases';
import { useProperty } from '@/api/properties';
import { useTenants } from '@/api/tenants';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/Modal';
import { SelectField } from '@/components/SelectField';
import { Skeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { toast } from '@/components/Toast';

import styles from './BailEditPage.module.scss';

type Lease = components['schemas']['Lease'];

type FormState = {
	leaseTypeKey: 'empty' | 'furnished';
	startDate: string;
	endDate: string;
	monthlyRentCents: number;
	monthlyChargesCents: number;
	chargesTypeKey: 'package' | 'real';
	depositCents: number;
	paymentDay: number;
	solidarity: boolean;
	tenantIds: string[];
	guarantorIds: string[];
};

const emptyForm: FormState = {
	leaseTypeKey: 'empty',
	startDate: new Date().toISOString().slice(0, 10),
	endDate: '',
	monthlyRentCents: 0,
	monthlyChargesCents: 0,
	chargesTypeKey: 'package',
	depositCents: 0,
	paymentDay: 5,
	solidarity: false,
	tenantIds: [],
	guarantorIds: [],
};

const leaseToForm = (lease: Lease): FormState => ({
	leaseTypeKey: lease.leaseTypeKey,
	startDate: lease.startDate,
	endDate: lease.endDate ?? '',
	monthlyRentCents: lease.monthlyRentCents,
	monthlyChargesCents: lease.monthlyChargesCents,
	chargesTypeKey: lease.chargesTypeKey,
	depositCents: lease.depositCents,
	paymentDay: lease.paymentDay,
	solidarity: lease.solidarity,
	tenantIds: lease.tenants?.map((t) => t.id) ?? [],
	guarantorIds: lease.guarantors?.map((g) => g.id) ?? [],
});

const euros = (cents: number): string => (cents / 100).toFixed(2);
const eurosToCents = (str: string): number => Math.round(parseFloat(str || '0') * 100);

export const BailEditPage = () => {
	const { propertyId, leaseId } = useParams<{ propertyId: string; leaseId?: string }>();
	const navigate = useNavigate();
	const isEdit = Boolean(leaseId);

	const propertyQ = useProperty(propertyId);
	const leaseQ = useLease(leaseId);
	const tenantsQ = useTenants();
	const guarantorsQ = useGuarantors();

	const createMut = useCreateLease();
	const patchMut = usePatchLease();
	const statusMut = useChangeLeaseStatus();
	const deleteMut = useDeleteLease();

	const [form, setForm] = useState<FormState>(emptyForm);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

	useEffect(() => {
		if (isEdit && leaseQ.data) setForm(leaseToForm(leaseQ.data));
	}, [isEdit, leaseQ.data]);

	const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	const tenantOptions = useMemo(() => tenantsQ.data ?? [], [tenantsQ.data]);
	const guarantorOptions = useMemo(() => guarantorsQ.data ?? [], [guarantorsQ.data]);

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!propertyId) return;
		if (form.tenantIds.length === 0) {
			toast.error('Sélectionne au moins un locataire avant de créer le bail.');
			return;
		}

		const basePayload = {
			leaseTypeKey: form.leaseTypeKey,
			startDate: form.startDate,
			...(form.endDate ? { endDate: form.endDate } : {}),
			monthlyRentCents: form.monthlyRentCents,
			monthlyChargesCents: form.monthlyChargesCents,
			chargesTypeKey: form.chargesTypeKey,
			depositCents: form.depositCents,
			paymentDay: form.paymentDay,
			solidarity: form.solidarity,
			tenantIds: form.tenantIds,
			guarantorIds: form.guarantorIds,
		};

		if (isEdit && leaseId) {
			patchMut.mutate(
				{ id: leaseId, body: basePayload },
				{ onSuccess: () => toast.success('Bail mis à jour') },
			);
		} else {
			createMut.mutate(
				{
					propertyId,
					signatureMethodKey: 'handwritten_scanned',
					originalPaperArchived: false,
					...basePayload,
				},
				{
					onSuccess: (created) => {
						toast.success('Bail créé en draft');
						navigate(`/biens/${propertyId}/baux/${created.id}`);
					},
				},
			);
		}
	};

	const onChangeStatus = (statusKey: 'draft' | 'active' | 'ended') => {
		if (!leaseId) return;
		statusMut.mutate(
			{ id: leaseId, statusKey },
			{ onSuccess: () => toast.success(`Bail marqué comme ${statusKey}`) },
		);
	};

	const onDelete = () => {
		if (!leaseId || !propertyId) return;
		deleteMut.mutate(leaseId, {
			onSuccess: () => {
				toast.success('Bail supprimé');
				navigate(`/biens`);
			},
		});
	};

	const isLoading = propertyQ.isLoading || (isEdit && leaseQ.isLoading);
	if (isLoading) return <Skeleton lines={10} />;

	if (!propertyQ.data) {
		return (
			<div className={styles.wrap}>
				<p>Bien introuvable.</p>
				<Button onPress={() => navigate('/biens')}>Retour</Button>
			</div>
		);
	}

	const property = propertyQ.data;
	const lease = leaseQ.data;
	const status = lease?.statusKey ?? 'draft';
	const isDraft = status === 'draft';

	return (
		<form className={styles.wrap} onSubmit={onSubmit}>
			<header className={styles.header}>
				<div>
					<h1>{isEdit ? 'Modifier le bail' : 'Nouveau bail'}</h1>
					<p className={styles.subtitle}>
						{property.addressLine} — {property.postalCode} {property.city}
						{lease ? ` · Statut : ${status}` : null}
					</p>
				</div>
				<Button onPress={() => navigate('/biens')} variant="ghost">
					← Retour
				</Button>
			</header>

			{/* ── Locataires ── */}
			<section className={styles.section}>
				<h2>Locataires</h2>
				<p className={styles.hint}>Sélectionne 1 ou plusieurs locataires existants (créés depuis la page Locataires).</p>
				{tenantOptions.length === 0 ? (
					<p className={styles.empty}>
						Aucun locataire enregistré. <Button onPress={() => navigate('/locataires')} variant="ghost">Créer un locataire</Button>
					</p>
				) : (
					<div className={styles.chips}>
						{tenantOptions.map((t) => {
							const selected = form.tenantIds.includes(t.id);
							return (
								<button
									className={`${styles.chip} ${selected ? styles.chipSelected : ''}`}
									key={t.id}
									onClick={() =>
										set(
											'tenantIds',
											selected
												? form.tenantIds.filter((id) => id !== t.id)
												: [...form.tenantIds, t.id],
										)
									}
									type="button"
								>
									{t.firstName} {t.lastName}
								</button>
							);
						})}
					</div>
				)}
			</section>

			{/* ── Garants (optionnel) ── */}
			<section className={styles.section}>
				<h2>Garants <span className={styles.optional}>(optionnel)</span></h2>
				{guarantorOptions.length === 0 ? (
					<p className={styles.empty}>
						Aucun garant enregistré. <Button onPress={() => navigate('/garants')} variant="ghost">Créer un garant</Button>
					</p>
				) : (
					<div className={styles.chips}>
						{guarantorOptions.map((g) => {
							const selected = form.guarantorIds.includes(g.id);
							const label =
								g.guarantorTypeKey === 'organization'
									? (g.organizationName ?? 'Organisation')
									: `${g.firstName ?? ''} ${g.lastName ?? ''}`.trim();
							return (
								<button
									className={`${styles.chip} ${selected ? styles.chipSelected : ''}`}
									key={g.id}
									onClick={() =>
										set(
											'guarantorIds',
											selected
												? form.guarantorIds.filter((id) => id !== g.id)
												: [...form.guarantorIds, g.id],
										)
									}
									type="button"
								>
									{label}
								</button>
							);
						})}
					</div>
				)}
			</section>

			{/* ── Conditions ── */}
			<section className={styles.section}>
				<h2>Conditions du bail</h2>
				<div className={styles.grid}>
					<SelectField
						label="Type de bail"
						onChange={(e) => set('leaseTypeKey', e.target.value as 'empty' | 'furnished')}
						options={[
							{ value: 'empty', label: 'Vide' },
							{ value: 'furnished', label: 'Meublé' },
						]}
						value={form.leaseTypeKey}
					/>
					<SelectField
						label="Type de charges"
						onChange={(e) => set('chargesTypeKey', e.target.value as 'package' | 'real')}
						options={[
							{ value: 'package', label: 'Forfait' },
							{ value: 'real', label: 'Provisions sur charges réelles' },
						]}
						value={form.chargesTypeKey}
					/>
					<TextField
						label="Date de début"
						onChange={(e) => set('startDate', e.target.value)}
						type="date"
						value={form.startDate}
					/>
					<TextField
						hint="Vide = tacite reconduction"
						label="Date de fin (optionnel)"
						onChange={(e) => set('endDate', e.target.value)}
						type="date"
						value={form.endDate}
					/>
					<TextField
						label="Loyer hors charges (€)"
						onChange={(e) => set('monthlyRentCents', eurosToCents(e.target.value))}
						step="0.01"
						type="number"
						value={euros(form.monthlyRentCents)}
					/>
					<TextField
						label="Charges (€)"
						onChange={(e) => set('monthlyChargesCents', eurosToCents(e.target.value))}
						step="0.01"
						type="number"
						value={euros(form.monthlyChargesCents)}
					/>
					<TextField
						label="Dépôt de garantie (€)"
						onChange={(e) => set('depositCents', eurosToCents(e.target.value))}
						step="0.01"
						type="number"
						value={euros(form.depositCents)}
					/>
					<TextField
						label="Jour d'échéance (1-31)"
						max="31"
						min="1"
						onChange={(e) => set('paymentDay', parseInt(e.target.value, 10) || 1)}
						type="number"
						value={String(form.paymentDay)}
					/>
				</div>
				<label className={styles.checkbox}>
					<input
						checked={form.solidarity}
						onChange={(e) => set('solidarity', e.target.checked)}
						type="checkbox"
					/>
					Clause de solidarité entre colocataires
				</label>
			</section>

			{/* ── Actions ── */}
			<div className={styles.actions}>
				<Button disabled={createMut.isPending || patchMut.isPending} type="submit">
					{createMut.isPending || patchMut.isPending
						? 'Enregistrement…'
						: isEdit
							? 'Enregistrer les modifications'
							: 'Créer le bail'}
				</Button>

				{isEdit && lease ? (
					<>
						{status === 'draft' ? (
							<Button onPress={() => onChangeStatus('active')} variant="filled">
								Marquer comme actif (signé)
							</Button>
						) : null}
						{status === 'active' ? (
							<Button onPress={() => onChangeStatus('ended')} variant="outlined">
								Marquer comme terminé
							</Button>
						) : null}
						<Button onPress={() => navigate(`/biens/${propertyId}/baux/${leaseId}/print`)} variant="outlined">
							Aperçu impression
						</Button>
						{isDraft ? (
							<Button onPress={() => setConfirmDeleteOpen(true)} variant="danger">
								Supprimer
							</Button>
						) : null}
					</>
				) : null}
			</div>

			<ConfirmDialog
				description="Le bail (draft) et ses junctions tenants/garants seront effacés. Action irréversible."
				isOpen={confirmDeleteOpen}
				isPending={deleteMut.isPending}
				onConfirm={onDelete}
				onOpenChange={setConfirmDeleteOpen}
				title="Supprimer ce bail ?"
				variant="danger"
			/>
		</form>
	);
};
