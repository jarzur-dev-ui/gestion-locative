// ⚠ M6 Phase 3 — TODO migration localStorage → API
// Cette page utilise encore `useData()` / DataContext (localStorage).
// Migration prévue : remplacer par useLease/useCreateLease/usePatchLease + useProperties
// + useTenants/useGuarantors + adapter BailDocument pour le nouveau shape API.
// L'app fonctionne en hybride pour l'instant.
import {
	useMemo,
	useState,
} from 'react';
import {
	useNavigate,
	useParams,
} from 'react-router-dom';

import { Button } from '@/components/Button';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import {
	BIEN_TYPES,
	CIVILITES,
	createBail,
	DPE_CLASSES,
	MODES_PAIEMENT,
	PERIODES_CONSTRUCTION,
	PRODUCTION,
	REGIMES,
	TYPES_IMMEUBLE,
} from '@/config/defaults';
import { useData } from '@/contexts/DataContext';
import type {
	Bail,
	BienType,
	Civilite,
} from '@/types';
import { slugify } from '@/utils/format';

import styles from './BailEditPage.module.scss';

const cityFromCp = (cp: string): string =>
	cp.split(/\s+/).slice(1).join('-') || cp;

export const BailEditPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { baux, getBail, upsertBail } = useData();

	const existing = id ? getBail(id) : undefined;
	const [bail, setBail] = useState<Bail>(existing ?? createBail());

	const set = <K extends keyof Bail>(key: K, value: Bail[K]): void =>
		setBail((prev) => ({ ...prev, [key]: value }));

	const num = (value: string): number => parseFloat(value) || 0;

	const resolvedId = useMemo(() => {
		if (bail.id) {
			return bail.id;
		}
		const base = `${slugify(cityFromCp(bail.cpVille))}-${bail.type}`;
		if (!baux.some((b) => b.id === base)) {
			return base;
		}
		let i = 2;
		while (baux.some((b) => b.id === `${base}-${i}`)) {
			i += 1;
		}
		return `${base}-${i}`;
	}, [bail.id, bail.cpVille, bail.type, baux]);

	const save = (): string => {
		const saved = { ...bail, id: resolvedId };
		upsertBail(saved);
		return saved.id;
	};

	return (
		<div className={styles.page}>
			<h1>{existing ? 'Éditer le bail' : 'Nouveau bail'}</h1>

			<section className={styles.section}>
				<h2>Locataire</h2>
				<div className={styles.grid}>
					<SelectField
						label="Civilité"
						onChange={(e) => set('civilite', e.target.value as Civilite)}
						options={CIVILITES}
						value={bail.civilite}
					/>
					<TextField
						label="Nom complet du locataire"
						onChange={(e) => set('locataire', e.target.value)}
						value={bail.locataire}
					/>
					<TextField
						label="Email du locataire (optionnel)"
						onChange={(e) => set('locataireEmail', e.target.value)}
						value={bail.locataireEmail}
					/>
					<TextField
						label="Garant — nom et adresse (optionnel)"
						onChange={(e) => set('garant', e.target.value)}
						value={bail.garant}
					/>
				</div>
			</section>

			<section className={styles.section}>
				<h2>Bien</h2>
				<div className={styles.grid}>
					<SelectField
						label="Nature du bien"
						onChange={(e) => set('type', e.target.value as BienType)}
						options={BIEN_TYPES}
						value={bail.type}
					/>
					<TextField
						label="Adresse (rue)"
						onChange={(e) => set('rue', e.target.value)}
						value={bail.rue}
					/>
					<TextField
						label="Code postal + ville"
						onChange={(e) => set('cpVille', e.target.value)}
						value={bail.cpVille}
					/>
					<TextField
						label="Bâtiment / étage / porte"
						onChange={(e) => set('batiment', e.target.value)}
						value={bail.batiment}
					/>
					<SelectField
						label="Type d'habitat"
						onChange={(e) => set('typeImmeuble', e.target.value)}
						options={TYPES_IMMEUBLE}
						value={bail.typeImmeuble}
					/>
					<SelectField
						label="Régime"
						onChange={(e) => set('regime', e.target.value)}
						options={REGIMES}
						value={bail.regime}
					/>
					<SelectField
						label="Période de construction"
						onChange={(e) => set('periodeConstruction', e.target.value)}
						options={PERIODES_CONSTRUCTION}
						value={bail.periodeConstruction}
					/>
					<TextField
						label="Surface habitable (m²)"
						onChange={(e) => set('surface', e.target.value)}
						value={bail.surface}
					/>
					<TextField
						label="Nombre de pièces"
						onChange={(e) => set('nbPieces', e.target.value)}
						value={bail.nbPieces}
					/>
					<SelectField
						label="Chauffage"
						onChange={(e) => set('chauffage', e.target.value)}
						options={PRODUCTION}
						value={bail.chauffage}
					/>
					<SelectField
						label="Eau chaude"
						onChange={(e) => set('eauChaude', e.target.value)}
						options={PRODUCTION}
						value={bail.eauChaude}
					/>
					<TextField
						label="Locaux accessoires (cave, parking n°…)"
						onChange={(e) => set('accessoires', e.target.value)}
						value={bail.accessoires}
					/>
					<TextField
						hint="Obligatoire depuis 2024"
						label="Identifiant fiscal du logement"
						onChange={(e) => set('identifiantFiscal', e.target.value)}
						value={bail.identifiantFiscal}
					/>
					<SelectField
						label="Classe énergétique (DPE)"
						onChange={(e) => set('dpe', e.target.value)}
						options={DPE_CLASSES}
						value={bail.dpe}
					/>
				</div>
			</section>

			<section className={styles.section}>
				<h2>Durée</h2>
				<div className={styles.grid}>
					<TextField
						label="Date de prise d'effet"
						onChange={(e) => set('dateEffet', e.target.value)}
						type="date"
						value={bail.dateEffet}
					/>
					<TextField
						label="Durée du contrat"
						onChange={(e) => set('duree', e.target.value)}
						value={bail.duree}
					/>
				</div>
			</section>

			<section className={styles.section}>
				<h2>Conditions financières</h2>
				<div className={styles.grid}>
					<TextField
						label="Loyer mensuel hors charges (€)"
						onChange={(e) => set('loyer', num(e.target.value))}
						type="number"
						value={bail.loyer}
					/>
					<TextField
						label="Provisions sur charges (€)"
						onChange={(e) => set('charges', num(e.target.value))}
						type="number"
						value={bail.charges}
					/>
					<TextField
						label="Modalité des charges"
						onChange={(e) => set('modaliteCharges', e.target.value)}
						value={bail.modaliteCharges}
					/>
					<TextField
						hint="Selon le bail (ex. 1, 5, 15)"
						label="Jour d'échéance"
						max={31}
						min={1}
						onChange={(e) => set('jourEcheance', num(e.target.value))}
						type="number"
						value={bail.jourEcheance}
					/>
					<TextField
						label="Révision annuelle (IRL)"
						onChange={(e) => set('revision', e.target.value)}
						value={bail.revision}
					/>
					<TextField
						label="Encadrement / zone tendue"
						onChange={(e) => set('zoneTendue', e.target.value)}
						value={bail.zoneTendue}
					/>
					<TextField
						label="Dépôt de garantie (€)"
						onChange={(e) => set('depotGarantie', num(e.target.value))}
						type="number"
						value={bail.depotGarantie}
					/>
					<SelectField
						label="Mode de paiement"
						onChange={(e) => set('modePaiement', e.target.value)}
						options={MODES_PAIEMENT}
						value={bail.modePaiement}
					/>
				</div>
			</section>

			<div className={styles.actions}>
				<Button onClick={() => navigate('/biens')} variant="ghost">
					Annuler
				</Button>
				<Button
					onClick={() => {
						save();
						navigate('/biens');
					}}
					variant="outlined"
				>
					Enregistrer
				</Button>
				<Button
					onClick={() => {
						const savedId = save();
						navigate(`/biens/${savedId}/bail`);
					}}
				>
					Enregistrer &amp; aperçu du bail
				</Button>
			</div>
		</div>
	);
};
