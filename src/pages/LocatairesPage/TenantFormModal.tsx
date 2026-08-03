import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { DatePickerField } from '@/components/DatePicker';
import { Modal } from '@/components/Modal';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { toast } from '@/components/Toast';

import {
	useCreateTenant,
	usePatchTenant,
	type CreateTenantBody,
	type PatchTenantBody,
	type Tenant,
} from '@/api/tenants';

import styles from './LocatairesPage.module.scss';

const CIVILITIES = ['', 'M.', 'Mme', 'Mlle'] as const;

interface FormState {
	civility: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	birthDate: string | null;
	birthPlace: string;
	currentAddressLine: string;
	currentPostalCode: string;
	currentCity: string;
}

const EMPTY_FORM: FormState = {
	civility: '',
	firstName: '',
	lastName: '',
	email: '',
	phone: '',
	birthDate: null,
	birthPlace: '',
	currentAddressLine: '',
	currentPostalCode: '',
	currentCity: '',
};

const fromTenant = (t: Tenant): FormState => ({
	civility: t.civility ?? '',
	firstName: t.firstName,
	lastName: t.lastName,
	email: t.email,
	phone: t.phone ?? '',
	birthDate: t.birthDate,
	birthPlace: t.birthPlace ?? '',
	currentAddressLine: t.currentAddressLine ?? '',
	currentPostalCode: t.currentPostalCode ?? '',
	currentCity: t.currentCity ?? '',
});

const trimOrUndef = (v: string): string | undefined => {
	const t = v.trim();
	return t.length === 0 ? undefined : t;
};

const trimOrNull = (v: string): string | null => {
	const t = v.trim();
	return t.length === 0 ? null : t;
};

interface TenantFormModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	/** undefined = création, sinon édition. */
	tenant?: Tenant;
}

export const TenantFormModal = ({ isOpen, onOpenChange, tenant }: TenantFormModalProps) => {
	const { t } = useTranslation();
	const isEdit = Boolean(tenant);
	const [form, setForm] = useState<FormState>(EMPTY_FORM);

	const createMutation = useCreateTenant();
	const patchMutation = usePatchTenant();
	const isPending = createMutation.isPending || patchMutation.isPending;

	// Hydrater le form quand on ouvre la modal sur un tenant donné.
	// Pattern "ajuster l'état pendant le rendu" (cf. doc React) : une seule
	// hydratation par ouverture, identifiée par le tenant ciblé. Évite le
	// useEffect + setState et son rendu en cascade.
	const hydrationKey = isOpen ? `${tenant?.id ?? 'new'}` : null;
	const [hydratedKey, setHydratedKey] = useState<string | null>(null);
	if (hydrationKey !== null && hydrationKey !== hydratedKey) {
		setHydratedKey(hydrationKey);
		setForm(tenant ? fromTenant(tenant) : EMPTY_FORM);
	} else if (hydrationKey === null && hydratedKey !== null) {
		setHydratedKey(null);
	}

	const setField = <K extends keyof FormState>(key: K, value: FormState[K]): void =>
		setForm((prev) => ({ ...prev, [key]: value }));

	const onSubmit = (e: FormEvent): void => {
		e.preventDefault();

		if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
			toast.error(t('locataires.toast.missingRequiredFields'));
			return;
		}

		if (isEdit && tenant) {
			const body: PatchTenantBody = {
				civility: trimOrNull(form.civility) ?? undefined,
				firstName: form.firstName.trim(),
				lastName: form.lastName.trim(),
				email: form.email.trim(),
				phone: trimOrNull(form.phone),
				birthDate: form.birthDate ?? null,
				birthPlace: trimOrNull(form.birthPlace),
				currentAddressLine: trimOrNull(form.currentAddressLine),
				currentPostalCode: trimOrNull(form.currentPostalCode),
				currentCity: trimOrNull(form.currentCity),
			};
			patchMutation.mutate(
				{ id: tenant.id, body },
				{
					onSuccess: () => {
						toast.success(t('locataires.toast.tenantUpdated'));
						onOpenChange(false);
					},
				},
			);
		} else {
			const body: CreateTenantBody = {
				civility: trimOrUndef(form.civility),
				firstName: form.firstName.trim(),
				lastName: form.lastName.trim(),
				email: form.email.trim(),
				phone: trimOrUndef(form.phone),
				birthDate: form.birthDate ?? undefined,
				birthPlace: trimOrUndef(form.birthPlace),
				currentAddressLine: trimOrUndef(form.currentAddressLine),
				currentPostalCode: trimOrUndef(form.currentPostalCode),
				currentCity: trimOrUndef(form.currentCity),
			};
			createMutation.mutate(body, {
				onSuccess: () => {
					toast.success(t('locataires.toast.tenantCreated'));
					onOpenChange(false);
				},
			});
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			size="lg"
			title={isEdit ? t('locataires.form.editTitle') : t('locataires.form.createTitle')}
		>
			<form className={styles.form} onSubmit={onSubmit}>
				<div className={styles.grid}>
					<SelectField
						label={t('locataires.form.civility')}
						onChange={(e) => setField('civility', e.target.value)}
						options={CIVILITIES}
						value={form.civility}
					/>
					<TextField
						label={t('locataires.form.firstName')}
						onChange={(e) => setField('firstName', e.target.value)}
						required
						value={form.firstName}
					/>
					<TextField
						label={t('locataires.form.lastName')}
						onChange={(e) => setField('lastName', e.target.value)}
						required
						value={form.lastName}
					/>
					<TextField
						label={t('locataires.form.email')}
						onChange={(e) => setField('email', e.target.value)}
						required
						type="email"
						value={form.email}
					/>
					<TextField
						label={t('locataires.form.phone')}
						onChange={(e) => setField('phone', e.target.value)}
						value={form.phone}
					/>
					<DatePickerField
						label={t('locataires.form.birthDate')}
						onChange={(v) => setField('birthDate', v)}
						value={form.birthDate}
					/>
					<TextField
						label={t('locataires.form.birthPlace')}
						onChange={(e) => setField('birthPlace', e.target.value)}
						value={form.birthPlace}
					/>
				</div>

				<h3 className={styles.subsection}>{t('locataires.form.currentAddressSection')}</h3>
				<div className={styles.grid}>
					<TextField
						className={styles.fullRow}
						label={t('locataires.form.addressLine')}
						onChange={(e) => setField('currentAddressLine', e.target.value)}
						value={form.currentAddressLine}
					/>
					<TextField
						label={t('locataires.form.postalCode')}
						onChange={(e) => setField('currentPostalCode', e.target.value)}
						value={form.currentPostalCode}
					/>
					<TextField
						label={t('locataires.form.city')}
						onChange={(e) => setField('currentCity', e.target.value)}
						value={form.currentCity}
					/>
				</div>

				<div className={styles.actions}>
					<Button
						disabled={isPending}
						onPress={() => onOpenChange(false)}
						variant="ghost"
					>
						{t('common.actions.cancel')}
					</Button>
					<Button disabled={isPending} type="submit">
						{isPending
							? t('locataires.form.submitting')
							: isEdit
								? t('common.actions.save')
								: t('common.actions.create')}
					</Button>
				</div>
			</form>
		</Modal>
	);
};
