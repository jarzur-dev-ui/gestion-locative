import { type FormEvent, useState } from 'react';

import { Button } from '@/components/Button';
import { DatePickerField } from '@/components/DatePicker';
import { Modal } from '@/components/Modal';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { toast } from '@/components/Toast';

import {
	useCreateGuarantor,
	usePatchGuarantor,
	type CreateGuarantorBody,
	type Guarantor,
	type GuarantorType,
	type PatchGuarantorBody,
} from '@/api/guarantors';

import styles from './GarantsPage.module.scss';

const CIVILITIES = ['', 'M.', 'Mme', 'Mlle'] as const;

const TYPE_OPTIONS = [
	{ key: 'person' as const, label: 'Personne physique' },
	{ key: 'organization' as const, label: 'Organisation' },
];

interface PersonFormState {
	civility: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	birthDate: string | null;
	birthPlace: string;
	addressLine: string;
	postalCode: string;
	city: string;
}

interface OrgFormState {
	organizationName: string;
	organizationReference: string;
	email: string;
	phone: string;
	addressLine: string;
	postalCode: string;
	city: string;
}

const EMPTY_PERSON: PersonFormState = {
	civility: '',
	firstName: '',
	lastName: '',
	email: '',
	phone: '',
	birthDate: null,
	birthPlace: '',
	addressLine: '',
	postalCode: '',
	city: '',
};

const EMPTY_ORG: OrgFormState = {
	organizationName: '',
	organizationReference: '',
	email: '',
	phone: '',
	addressLine: '',
	postalCode: '',
	city: '',
};

const fromGuarantorPerson = (g: Guarantor): PersonFormState => ({
	civility: g.civility ?? '',
	firstName: g.firstName ?? '',
	lastName: g.lastName ?? '',
	email: g.email ?? '',
	phone: g.phone ?? '',
	birthDate: g.birthDate,
	birthPlace: g.birthPlace ?? '',
	addressLine: g.addressLine ?? '',
	postalCode: g.postalCode ?? '',
	city: g.city ?? '',
});

const fromGuarantorOrg = (g: Guarantor): OrgFormState => ({
	organizationName: g.organizationName ?? '',
	organizationReference: g.organizationReference ?? '',
	email: g.email ?? '',
	phone: g.phone ?? '',
	addressLine: g.addressLine ?? '',
	postalCode: g.postalCode ?? '',
	city: g.city ?? '',
});

const trimOrUndef = (v: string): string | undefined => {
	const t = v.trim();
	return t.length === 0 ? undefined : t;
};

const trimOrNull = (v: string): string | null => {
	const t = v.trim();
	return t.length === 0 ? null : t;
};

interface GuarantorFormModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	/** undefined = création (l'utilisateur choisit le type), sinon édition (type figé). */
	guarantor?: Guarantor;
	/** Valeur initiale du type en création (utile pour pré-sélectionner via le tab actif). */
	initialType?: GuarantorType;
}

export const GuarantorFormModal = ({
	isOpen,
	onOpenChange,
	guarantor,
	initialType = 'person',
}: GuarantorFormModalProps) => {
	const isEdit = Boolean(guarantor);

	// Le type est immutable côté back : en édition on le verrouille à la
	// valeur du guarantor, en création on autorise le switch via le select.
	const [type, setType] = useState<GuarantorType>(initialType);
	const [personForm, setPersonForm] = useState<PersonFormState>(EMPTY_PERSON);
	const [orgForm, setOrgForm] = useState<OrgFormState>(EMPTY_ORG);

	const createMutation = useCreateGuarantor();
	const patchMutation = usePatchGuarantor();
	const isPending = createMutation.isPending || patchMutation.isPending;

	// Re-hydrate à l'ouverture / changement de cible.
	// Pattern "ajuster l'état pendant le rendu" (cf. doc React) : on hydrate une
	// seule fois par ouverture, identifiée par (guarantor, initialType). Évite le
	// useEffect + setState et son rendu en cascade.
	const hydrationKey = isOpen ? `${guarantor?.id ?? 'new'}:${initialType}` : null;
	const [hydratedKey, setHydratedKey] = useState<string | null>(null);
	if (hydrationKey && hydrationKey !== hydratedKey) {
		setHydratedKey(hydrationKey);
		if (guarantor) {
			setType(guarantor.guarantorTypeKey);
			if (guarantor.guarantorTypeKey === 'person') {
				setPersonForm(fromGuarantorPerson(guarantor));
				setOrgForm(EMPTY_ORG);
			} else {
				setOrgForm(fromGuarantorOrg(guarantor));
				setPersonForm(EMPTY_PERSON);
			}
		} else {
			setType(initialType);
			setPersonForm(EMPTY_PERSON);
			setOrgForm(EMPTY_ORG);
		}
	} else if (!isOpen && hydratedKey !== null) {
		// Réinitialise le marqueur à la fermeture pour ré-hydrater au prochain open.
		setHydratedKey(null);
	}

	const setPersonField = <K extends keyof PersonFormState>(
		key: K,
		value: PersonFormState[K],
	): void => setPersonForm((prev) => ({ ...prev, [key]: value }));

	const setOrgField = <K extends keyof OrgFormState>(key: K, value: OrgFormState[K]): void =>
		setOrgForm((prev) => ({ ...prev, [key]: value }));

	const submitCreate = (): void => {
		let body: CreateGuarantorBody;
		if (type === 'person') {
			if (!personForm.firstName.trim() || !personForm.lastName.trim()) {
				toast.error('Prénom et nom sont obligatoires.');
				return;
			}
			body = {
				guarantorTypeKey: 'person',
				civility: trimOrUndef(personForm.civility),
				firstName: personForm.firstName.trim(),
				lastName: personForm.lastName.trim(),
				email: trimOrUndef(personForm.email),
				phone: trimOrUndef(personForm.phone),
				birthDate: personForm.birthDate ?? undefined,
				birthPlace: trimOrUndef(personForm.birthPlace),
				addressLine: trimOrUndef(personForm.addressLine),
				postalCode: trimOrUndef(personForm.postalCode),
				city: trimOrUndef(personForm.city),
			};
		} else {
			if (!orgForm.organizationName.trim()) {
				toast.error("Le nom de l'organisation est obligatoire.");
				return;
			}
			body = {
				guarantorTypeKey: 'organization',
				organizationName: orgForm.organizationName.trim(),
				organizationReference: trimOrUndef(orgForm.organizationReference),
				email: trimOrUndef(orgForm.email),
				phone: trimOrUndef(orgForm.phone),
				addressLine: trimOrUndef(orgForm.addressLine),
				postalCode: trimOrUndef(orgForm.postalCode),
				city: trimOrUndef(orgForm.city),
			};
		}
		createMutation.mutate(body, {
			onSuccess: () => {
				toast.success('Garant créé');
				onOpenChange(false);
			},
		});
	};

	const submitPatch = (): void => {
		if (!guarantor) return;
		// On envoie uniquement les champs pertinents pour le type courant.
		// `guarantorTypeKey` est volontairement omis (immutable côté back).
		let body: PatchGuarantorBody;
		if (type === 'person') {
			body = {
				civility: trimOrNull(personForm.civility),
				firstName: personForm.firstName.trim(),
				lastName: personForm.lastName.trim(),
				email: trimOrNull(personForm.email),
				phone: trimOrNull(personForm.phone),
				birthDate: personForm.birthDate ?? null,
				birthPlace: trimOrNull(personForm.birthPlace),
				addressLine: trimOrNull(personForm.addressLine),
				postalCode: trimOrNull(personForm.postalCode),
				city: trimOrNull(personForm.city),
			};
		} else {
			body = {
				organizationName: orgForm.organizationName.trim(),
				organizationReference: trimOrNull(orgForm.organizationReference),
				email: trimOrNull(orgForm.email),
				phone: trimOrNull(orgForm.phone),
				addressLine: trimOrNull(orgForm.addressLine),
				postalCode: trimOrNull(orgForm.postalCode),
				city: trimOrNull(orgForm.city),
			};
		}
		patchMutation.mutate(
			{ id: guarantor.id, body },
			{
				onSuccess: () => {
					toast.success('Garant mis à jour');
					onOpenChange(false);
				},
			},
		);
	};

	const onSubmit = (e: FormEvent): void => {
		e.preventDefault();
		if (isEdit) submitPatch();
		else submitCreate();
	};

	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			size="lg"
			title={isEdit ? 'Modifier le garant' : 'Ajouter un garant'}
		>
			<form className={styles.form} onSubmit={onSubmit}>
				{/* Type : éditable uniquement en création. */}
				<div className={styles.typeRow}>
					<label className={styles.typeLabel} htmlFor="guarantor-type">
						Type de garant
					</label>
					{isEdit ? (
						<span className={styles.typeReadonly}>
							{type === 'person' ? 'Personne physique' : 'Organisation'}
							<span className={styles.muted}>
								{' '}
								— le type est figé après création
							</span>
						</span>
					) : (
						<select
							className={styles.typeSelect}
							id="guarantor-type"
							onChange={(e) => setType(e.target.value as GuarantorType)}
							value={type}
						>
							{TYPE_OPTIONS.map((o) => (
								<option key={o.key} value={o.key}>
									{o.label}
								</option>
							))}
						</select>
					)}
				</div>

				{type === 'person' ? (
					<>
						<div className={styles.grid}>
							<SelectField
								label="Civilité"
								onChange={(e) => setPersonField('civility', e.target.value)}
								options={CIVILITIES}
								value={personForm.civility}
							/>
							<TextField
								label="Prénom"
								onChange={(e) => setPersonField('firstName', e.target.value)}
								required
								value={personForm.firstName}
							/>
							<TextField
								label="Nom"
								onChange={(e) => setPersonField('lastName', e.target.value)}
								required
								value={personForm.lastName}
							/>
							<TextField
								label="Email"
								onChange={(e) => setPersonField('email', e.target.value)}
								type="email"
								value={personForm.email}
							/>
							<TextField
								label="Téléphone"
								onChange={(e) => setPersonField('phone', e.target.value)}
								value={personForm.phone}
							/>
							<DatePickerField
								label="Date de naissance"
								onChange={(v) => setPersonField('birthDate', v)}
								value={personForm.birthDate}
							/>
							<TextField
								label="Lieu de naissance"
								onChange={(e) => setPersonField('birthPlace', e.target.value)}
								value={personForm.birthPlace}
							/>
						</div>

						<h3 className={styles.subsection}>Adresse</h3>
						<div className={styles.grid}>
							<TextField
								className={styles.fullRow}
								label="Adresse"
								onChange={(e) => setPersonField('addressLine', e.target.value)}
								value={personForm.addressLine}
							/>
							<TextField
								label="Code postal"
								onChange={(e) => setPersonField('postalCode', e.target.value)}
								value={personForm.postalCode}
							/>
							<TextField
								label="Ville"
								onChange={(e) => setPersonField('city', e.target.value)}
								value={personForm.city}
							/>
						</div>
					</>
				) : (
					<>
						<div className={styles.grid}>
							<TextField
								className={styles.fullRow}
								label="Nom de l'organisation"
								onChange={(e) => setOrgField('organizationName', e.target.value)}
								required
								value={orgForm.organizationName}
							/>
							<TextField
								hint="SIREN, n° interne, etc."
								label="Référence organisation"
								onChange={(e) =>
									setOrgField('organizationReference', e.target.value)
								}
								value={orgForm.organizationReference}
							/>
							<TextField
								label="Email (optionnel)"
								onChange={(e) => setOrgField('email', e.target.value)}
								type="email"
								value={orgForm.email}
							/>
							<TextField
								label="Téléphone"
								onChange={(e) => setOrgField('phone', e.target.value)}
								value={orgForm.phone}
							/>
						</div>

						<h3 className={styles.subsection}>Adresse</h3>
						<div className={styles.grid}>
							<TextField
								className={styles.fullRow}
								label="Adresse"
								onChange={(e) => setOrgField('addressLine', e.target.value)}
								value={orgForm.addressLine}
							/>
							<TextField
								label="Code postal"
								onChange={(e) => setOrgField('postalCode', e.target.value)}
								value={orgForm.postalCode}
							/>
							<TextField
								label="Ville"
								onChange={(e) => setOrgField('city', e.target.value)}
								value={orgForm.city}
							/>
						</div>
					</>
				)}

				<div className={styles.actions}>
					<Button
						disabled={isPending}
						onPress={() => onOpenChange(false)}
						variant="ghost"
					>
						Annuler
					</Button>
					<Button disabled={isPending} type="submit">
						{isPending ? '…en cours' : isEdit ? 'Enregistrer' : 'Créer'}
					</Button>
				</div>
			</form>
		</Modal>
	);
};
