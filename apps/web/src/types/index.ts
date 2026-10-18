export type BienType = 'logement' | 'parking';

export type Civilite = 'Monsieur' | 'Madame';

export interface Bailleur {
	nom: string;
	adresse: string;
	cpVille: string;
	email: string;
	lieuSignature: string;
	signatureDataUrl: string;
}

export interface Bail {
	id: string;
	// Locataire
	civilite: Civilite;
	locataire: string;
	locataireEmail: string;
	garant: string;
	// Bien
	type: BienType;
	rue: string;
	cpVille: string;
	batiment: string;
	typeImmeuble: string;
	regime: string;
	periodeConstruction: string;
	surface: string;
	nbPieces: string;
	chauffage: string;
	eauChaude: string;
	accessoires: string;
	identifiantFiscal: string;
	dpe: string;
	// Durée
	dateEffet: string; // ISO yyyy-mm-dd
	duree: string;
	// Conditions financières
	loyer: number;
	charges: number;
	modaliteCharges: string;
	jourEcheance: number;
	revision: string;
	zoneTendue: string;
	depotGarantie: number;
	modePaiement: string;
}

export interface QuittanceOptions {
	dateEmission: string; // ISO yyyy-mm-dd
	soldeAnterieur: number;
	teom: number;
	regulCharges: number;
}
