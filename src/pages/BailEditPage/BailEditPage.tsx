import { type FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { paths } from '@/config/routes';

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
	const { t } = useTranslation();
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

	// Hydrate le formulaire dès que les données du bail arrivent (mode édition).
	// Pattern "ajuster l'état pendant le rendu" recommandé par React, plutôt qu'un
	// useEffect + setState (qui déclenche un rendu en cascade).
	const [hydratedFrom, setHydratedFrom] = useState<Lease | null>(null);
	if (isEdit && leaseQ.data && leaseQ.data !== hydratedFrom) {
		setHydratedFrom(leaseQ.data);
		setForm(leaseToForm(leaseQ.data));
	}

	const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	const tenantOptions = useMemo(() => tenantsQ.data ?? [], [tenantsQ.data]);
	const guarantorOptions = useMemo(() => guarantorsQ.data ?? [], [guarantorsQ.data]);

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!propertyId) return;
		if (form.tenantIds.length === 0) {
			toast.error(t('baux.edit.selectTenantError'));
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
				{ onSuccess: () => toast.success(t('baux.edit.updatedToast')) },
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
						toast.success(t('baux.edit.createdToast'));
						navigate(paths.leaseEdit(propertyId, created.id));
					},
				},
			);
		}
	};

	const onChangeStatus = (statusKey: 'draft' | 'active' | 'ended') => {
		if (!leaseId) return;
		statusMut.mutate(
			{ id: leaseId, statusKey },
			{
				onSuccess: () =>
					toast.success(
						t('baux.edit.statusChangedToast', { status: t(`domain.leaseStatus.${statusKey}` as never) }),
					),
			},
		);
	};

	const onDelete = () => {
		if (!leaseId || !propertyId) return;
		deleteMut.mutate(leaseId, {
			onSuccess: () => {
				toast.success(t('baux.edit.deletedToast'));
				navigate(paths.biens());
			},
		});
	};

	const isLoading = propertyQ.isLoading || (isEdit && leaseQ.isLoading);
	if (isLoading) return <Skeleton lines={10} />;

	if (!propertyQ.data) {
		return (
			<div className={styles.wrap}>
				<p>{t('baux.edit.propertyNotFound')}</p>
				<Button onPress={() => navigate(paths.biens())}>{t('baux.actions.backPlain')}</Button>
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
					<h1>{isEdit ? t('baux.edit.editTitle') : t('baux.edit.newTitle')}</h1>
					<p className={styles.subtitle}>
						{property.addressLine} — {property.postalCode} {property.city}
						{lease
							? ` · ${t('baux.edit.statusLabel', { status: t(`domain.leaseStatus.${status}` as never) })}`
							: null}
					</p>
				</div>
				<Button onPress={() => navigate(paths.biens())} variant="ghost">
					{t('baux.actions.back')}
				</Button>
			</header>

			{/* ── Locataires ── */}
			<section className={styles.section}>
				<h2>{t('baux.edit.tenantsTitle')}</h2>
				<p className={styles.hint}>{t('baux.edit.tenantsHint')}</p>
				{tenantOptions.length === 0 ? (
					<p className={styles.empty}>
						{t('baux.edit.noTenants')}{' '}
						<Button onPress={() => navigate(paths.locataires())} variant="ghost">
							{t('baux.edit.createTenant')}
						</Button>
					</p>
				) : (
					<div className={styles.chips}>
						{tenantOptions.map((tenant) => {
							const selected = form.tenantIds.includes(tenant.id);
							return (
								<button
									className={`${styles.chip} ${selected ? styles.chipSelected : ''}`}
									key={tenant.id}
									onClick={() =>
										set(
											'tenantIds',
											selected
												? form.tenantIds.filter((id) => id !== tenant.id)
												: [...form.tenantIds, tenant.id],
										)
									}
									type="button"
								>
									{tenant.firstName} {tenant.lastName}
								</button>
							);
						})}
					</div>
				)}
			</section>

			{/* ── Garants (optionnel) ── */}
			<section className={styles.section}>
				<h2>
					{t('baux.edit.guarantorsTitle')}{' '}
					<span className={styles.optional}>{t('baux.edit.optional')}</span>
				</h2>
				{guarantorOptions.length === 0 ? (
					<p className={styles.empty}>
						{t('baux.edit.noGuarantors')}{' '}
						<Button onPress={() => navigate(paths.garants())} variant="ghost">
							{t('baux.edit.createGuarantor')}
						</Button>
					</p>
				) : (
					<div className={styles.chips}>
						{guarantorOptions.map((g) => {
							const selected = form.guarantorIds.includes(g.id);
							const label =
								g.guarantorTypeKey === 'organization'
									? (g.organizationName ?? t('baux.edit.organizationFallback'))
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
				<h2>{t('baux.edit.conditionsTitle')}</h2>
				<div className={styles.grid}>
					<SelectField
						label={t('baux.edit.leaseTypeLabel')}
						onChange={(e) => set('leaseTypeKey', e.target.value as 'empty' | 'furnished')}
						options={[
							{ value: 'empty', label: t('baux.edit.leaseTypeEmptyOption') },
							{ value: 'furnished', label: t('domain.furnished.furnished') },
						]}
						value={form.leaseTypeKey}
					/>
					<SelectField
						label={t('baux.edit.chargesTypeLabel')}
						onChange={(e) => set('chargesTypeKey', e.target.value as 'package' | 'real')}
						options={[
							{ value: 'package', label: t('baux.edit.chargesTypePackage') },
							{ value: 'real', label: t('baux.edit.chargesTypeReal') },
						]}
						value={form.chargesTypeKey}
					/>
					<TextField
						label={t('baux.edit.startDateLabel')}
						onChange={(e) => set('startDate', e.target.value)}
						type="date"
						value={form.startDate}
					/>
					<TextField
						hint={t('baux.edit.endDateHint')}
						label={t('baux.edit.endDateLabel')}
						onChange={(e) => set('endDate', e.target.value)}
						type="date"
						value={form.endDate}
					/>
					<TextField
						label={t('baux.edit.rentLabel')}
						onChange={(e) => set('monthlyRentCents', eurosToCents(e.target.value))}
						step="0.01"
						type="number"
						value={euros(form.monthlyRentCents)}
					/>
					<TextField
						label={t('baux.edit.chargesLabel')}
						onChange={(e) => set('monthlyChargesCents', eurosToCents(e.target.value))}
						step="0.01"
						type="number"
						value={euros(form.monthlyChargesCents)}
					/>
					<TextField
						label={t('baux.edit.depositLabel')}
						onChange={(e) => set('depositCents', eurosToCents(e.target.value))}
						step="0.01"
						type="number"
						value={euros(form.depositCents)}
					/>
					<TextField
						label={t('baux.edit.paymentDayLabel')}
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
					{t('baux.edit.solidarityLabel')}
				</label>
			</section>

			{/* ── Actions ── */}
			<div className={styles.actions}>
				<Button disabled={createMut.isPending || patchMut.isPending} type="submit">
					{createMut.isPending || patchMut.isPending
						? t('baux.edit.submitSaving')
						: isEdit
							? t('baux.edit.submitEdit')
							: t('baux.edit.submitCreate')}
				</Button>

				{isEdit && lease ? (
					<>
						{status === 'draft' ? (
							<Button onPress={() => onChangeStatus('active')} variant="filled">
								{t('baux.edit.markActive')}
							</Button>
						) : null}
						{status === 'active' ? (
							<Button onPress={() => onChangeStatus('ended')} variant="outlined">
								{t('baux.edit.markEnded')}
							</Button>
						) : null}
						<Button onPress={() => navigate(paths.leasePrint(propertyId, leaseId))} variant="outlined">
							{t('baux.edit.printPreview')}
						</Button>
						{isDraft ? (
							<Button onPress={() => setConfirmDeleteOpen(true)} variant="danger">
								{t('common.actions.delete')}
							</Button>
						) : null}
					</>
				) : null}
			</div>

			<ConfirmDialog
				description={t('baux.edit.deleteDescription')}
				isOpen={confirmDeleteOpen}
				isPending={deleteMut.isPending}
				onConfirm={onDelete}
				onOpenChange={setConfirmDeleteOpen}
				title={t('baux.edit.deleteTitle')}
				variant="danger"
			/>
		</form>
	);
};
