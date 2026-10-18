import type {
	Bail,
	Bailleur,
	BienType,
	Civilite,
	QuittanceOptions,
} from '@/types';

import {
	echeanceIso,
	nextMonth,
	periodeForMonth,
} from './dates';
import {
	formatAmount,
	formatDateFr,
} from './format';

export interface LigneMontant {
	date: string;
	libelle: string;
	montant: string;
}

export interface QuittanceVM {
	numero: string;
	bailleurNom: string;
	bailleurAdresse: string;
	bailleurCpVille: string;
	lieuSignature: string;
	signatureDataUrl: string;
	civilite: string;
	locataire: string;
	locataireRue: string;
	locataireCpVille: string;
	natureBien: string;
	bienAdresse: string;
	dateEmission: string;
	periodeDebut: string;
	periodeFin: string;
	quittanceLignes: LigneMontant[];
	netPaye: string;
	modePaiement: string;
	echeance: string;
	avisLignes: LigneMontant[];
	soldeDebiteur: string;
}

export const natureBien = (type: BienType): string =>
	type === 'parking' ? 'Emplacement de stationnement' : 'Logement';

export const pronom = (civilite: Civilite): string =>
	civilite === 'Madame' ? 'elle' : 'il';

export const buildQuittance = (
	bail: Bail,
	bailleur: Bailleur,
	year: number,
	month: number,
	index: number,
	options: QuittanceOptions,
): QuittanceVM => {
	const periode = periodeForMonth(year, month);
	const avis = nextMonth(year, month);
	const avisPeriode = periodeForMonth(avis.year, avis.month);
	const echeance = echeanceIso(avis.year, avis.month, bail.jourEcheance);

	const isLogement = bail.type === 'logement';
	const teom = isLogement ? options.teom : 0;
	const regul = isLogement ? options.regulCharges : 0;
	const total = bail.loyer + bail.charges;
	const netPaye = total + teom + regul;
	const soldeDebiteur = options.soldeAnterieur + total;

	const debutFr = formatDateFr(periode.debut);
	const finFr = formatDateFr(periode.fin);

	const quittanceLignes: LigneMontant[] = [
		{
			date: debutFr,
			libelle: `Loyer hors charges (${debutFr} – ${finFr})`,
			montant: `${formatAmount(bail.loyer)} €`,
		},
	];
	if (bail.charges > 0) {
		quittanceLignes.push({
			date: debutFr,
			libelle: `Provisions sur charges (${debutFr} – ${finFr})`,
			montant: `${formatAmount(bail.charges)} €`,
		});
	}
	if (regul !== 0) {
		quittanceLignes.push({
			date: debutFr,
			libelle: 'Régularisation annuelle des charges',
			montant: `${formatAmount(regul)} €`,
		});
	}
	if (teom > 0) {
		quittanceLignes.push({
			date: debutFr,
			libelle: "Régularisation TEOM (taxe d'enlèvement des ordures ménagères)",
			montant: `${formatAmount(teom)} €`,
		});
	}

	const avisDebutFr = formatDateFr(avisPeriode.debut);
	const avisFinFr = formatDateFr(avisPeriode.fin);
	const avisLignes: LigneMontant[] = [
		{
			date: avisDebutFr,
			libelle: 'Solde antérieur',
			montant: `${formatAmount(options.soldeAnterieur)} €`,
		},
		{
			date: avisDebutFr,
			libelle: `Loyer hors charges (${avisDebutFr} – ${avisFinFr})`,
			montant: `${formatAmount(bail.loyer)} €`,
		},
	];
	if (bail.charges > 0) {
		avisLignes.push({
			date: avisDebutFr,
			libelle: `Provisions sur charges (${avisDebutFr} – ${avisFinFr})`,
			montant: `${formatAmount(bail.charges)} €`,
		});
	}

	return {
		numero: `${year}-${String(month).padStart(2, '0')}-${String(index + 1).padStart(3, '0')}`,
		bailleurNom: bailleur.nom,
		bailleurAdresse: bailleur.adresse,
		bailleurCpVille: bailleur.cpVille,
		lieuSignature: bailleur.lieuSignature,
		signatureDataUrl: bailleur.signatureDataUrl,
		civilite: bail.civilite,
		locataire: bail.locataire,
		locataireRue: bail.rue,
		locataireCpVille: bail.cpVille,
		natureBien: natureBien(bail.type),
		bienAdresse: `${bail.rue} ${bail.cpVille}`.trim(),
		dateEmission: formatDateFr(options.dateEmission),
		periodeDebut: debutFr,
		periodeFin: finFr,
		quittanceLignes,
		netPaye: `${formatAmount(netPaye)} €`,
		modePaiement: bail.modePaiement,
		echeance: formatDateFr(echeance),
		avisLignes,
		soldeDebiteur: `${formatAmount(soldeDebiteur)} €`,
	};
};
