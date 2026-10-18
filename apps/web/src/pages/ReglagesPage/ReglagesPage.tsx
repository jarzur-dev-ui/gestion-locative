import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import {
	useLandlordProfile,
	useUpsertLandlordProfile,
	type UpsertLandlordProfile,
} from '@/api/landlord-profiles';
import { Button } from '@/components/Button';
import { SelectField } from '@/components/SelectField';
import { SignaturePad } from '@/components/SignaturePad';
import { Skeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { toast } from '@/components/Toast';

import styles from './ReglagesPage.module.scss';

const CIVILITY_OPTIONS = ['', 'M.', 'Mme'] as const;

interface FormState {
	civility: string;
	firstName: string;
	lastName: string;
	addressLine: string;
	postalCode: string;
	city: string;
	email: string;
	phone: string;
	iban: string;
}

const EMPTY_FORM: FormState = {
	civility: '',
	firstName: '',
	lastName: '',
	addressLine: '',
	postalCode: '',
	city: '',
	email: '',
	phone: '',
	iban: '',
};

function isFormValid(form: FormState): boolean {
	return (
		form.firstName.trim() !== '' &&
		form.lastName.trim() !== '' &&
		form.addressLine.trim() !== '' &&
		form.postalCode.trim() !== '' &&
		form.city.trim() !== ''
	);
}

function toUpsertPayload(form: FormState): UpsertLandlordProfile {
	const payload: UpsertLandlordProfile = {
		firstName: form.firstName.trim(),
		lastName: form.lastName.trim(),
		addressLine: form.addressLine.trim(),
		postalCode: form.postalCode.trim(),
		city: form.city.trim(),
	};
	if (form.civility.trim() !== '') payload.civility = form.civility.trim();
	if (form.email.trim() !== '') payload.email = form.email.trim();
	if (form.phone.trim() !== '') payload.phone = form.phone.trim();
	if (form.iban.trim() !== '') payload.iban = form.iban.trim();
	return payload;
}

export const ReglagesPage = () => {
	const { t } = useTranslation();
	const profileQuery = useLandlordProfile();
	const upsertMutation = useUpsertLandlordProfile();

	const [form, setForm] = useState<FormState>(EMPTY_FORM);
	// Signature dessinée localement — non envoyée au backend pour V1
	// (pas encore d'endpoint d'upload, voir TODO ci-dessous).
	const [signatureDataUrl, setSignatureDataUrl] = useState('');

	// Hydrate le formulaire dès que la query résout (création ou édition).
	// Pattern "ajuster l'état pendant le rendu" (cf. doc React) plutôt qu'un
	// useEffect + setState : on hydrate une fois par identité de données.
	const profile = profileQuery.data;
	const [hydratedFrom, setHydratedFrom] = useState<typeof profile>(undefined);
	if (profile && profile !== hydratedFrom) {
		setHydratedFrom(profile);
		setForm({
			civility: profile.civility ?? '',
			firstName: profile.firstName,
			lastName: profile.lastName,
			addressLine: profile.addressLine,
			postalCode: profile.postalCode,
			city: profile.city,
			email: profile.email ?? '',
			phone: profile.phone ?? '',
			iban: profile.iban ?? '',
		});
	}

	const valid = useMemo(() => isFormValid(form), [form]);

	const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		if (!valid || upsertMutation.isPending) return;
		upsertMutation.mutate(toUpsertPayload(form), {
			onSuccess: () => {
				toast.success(t('settings.toast.saved'));
			},
		});
	};

	if (profileQuery.isLoading) {
		return (
			<div className={styles.page}>
				<h1>{t('settings.title')}</h1>
				<Skeleton lines={6} />
			</div>
		);
	}

	return (
		<form className={styles.page} onSubmit={onSubmit}>
			<h1>{t('settings.title')}</h1>
			<p className={styles.intro}>{t('settings.intro')}</p>

			<section className={styles.grid}>
				<SelectField
					label={t('settings.form.civility')}
					onChange={(e) => set('civility', e.target.value)}
					options={CIVILITY_OPTIONS}
					value={form.civility}
				/>
				<div /> {/* spacer pour aligner la grille */}
				<TextField
					label={t('settings.form.firstName')}
					onChange={(e) => set('firstName', e.target.value)}
					required
					value={form.firstName}
				/>
				<TextField
					label={t('settings.form.lastName')}
					onChange={(e) => set('lastName', e.target.value)}
					required
					value={form.lastName}
				/>
				<TextField
					label={t('settings.form.addressLine')}
					onChange={(e) => set('addressLine', e.target.value)}
					required
					value={form.addressLine}
				/>
				<TextField
					label={t('settings.form.postalCode')}
					onChange={(e) => set('postalCode', e.target.value)}
					required
					value={form.postalCode}
				/>
				<TextField
					label={t('settings.form.city')}
					onChange={(e) => set('city', e.target.value)}
					required
					value={form.city}
				/>
				<TextField
					label={t('settings.form.email')}
					onChange={(e) => set('email', e.target.value)}
					type="email"
					value={form.email}
				/>
				<TextField
					label={t('settings.form.phone')}
					onChange={(e) => set('phone', e.target.value)}
					value={form.phone}
				/>
				<TextField
					label={t('settings.form.iban')}
					onChange={(e) => set('iban', e.target.value)}
					value={form.iban}
				/>
			</section>

			<section className={styles.signature}>
				<h2>{t('settings.signature.title')}</h2>
				{/* TODO M6+ : brancher l'upload signature via POST /api/landlord-profile/signature
				    (endpoint à créer côté back, pas encore en place). Pour l'instant la signature
				    est temporaire et ne persiste pas. */}
				<SignaturePad
					label={t('settings.signature.padLabel')}
					onChange={setSignatureDataUrl}
					value={signatureDataUrl}
				/>
			</section>

			<div className={styles.actions}>
				<Button
					isDisabled={!valid || upsertMutation.isPending}
					type="submit"
				>
					{upsertMutation.isPending ? t('settings.form.saving') : t('common.actions.save')}
				</Button>
			</div>
		</form>
	);
};
