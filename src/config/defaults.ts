import type {
	Bail,
	Bailleur,
} from '@/types';

export const DEFAULT_BAILLEUR: Bailleur = {
	nom: 'Jonathan ARZUR',
	adresse: '14 avenue Paul Vaillant Couturier',
	cpVille: '91390 Morsang sur Orge',
	email: '',
	lieuSignature: 'Morsang sur Orge',
	signatureDataUrl: '',
};

export const CIVILITES = ['Monsieur', 'Madame'] as const;
export const BIEN_TYPES = ['logement', 'parking'] as const;
export const TYPES_IMMEUBLE = ['Immeuble collectif', 'Immeuble individuel'];
export const REGIMES = ['Copropriété', 'Monopropriété'];
export const PERIODES_CONSTRUCTION = [
	'Avant 1949',
	'De 1949 à 1974',
	'De 1975 à 1989',
	'De 1989 à 2005',
	'Depuis 2005',
];
export const PRODUCTION = ['Individuel', 'Collectif'];
export const DPE_CLASSES = ['—', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
export const MODES_PAIEMENT = ['virement', 'chèque', 'espèces', 'prélèvement'];

export const createBail = (): Bail => ({
	id: '',
	civilite: 'Monsieur',
	locataire: '',
	locataireEmail: '',
	garant: '',
	type: 'logement',
	rue: '',
	cpVille: '',
	batiment: '',
	typeImmeuble: 'Immeuble collectif',
	regime: 'Copropriété',
	periodeConstruction: 'Depuis 2005',
	surface: '',
	nbPieces: '2',
	chauffage: 'Individuel',
	eauChaude: 'Individuel',
	accessoires: 'Néant',
	identifiantFiscal: '',
	dpe: '—',
	dateEffet: '',
	duree: '3 ans (bailleur personne physique)',
	loyer: 0,
	charges: 0,
	modaliteCharges: 'Provisions sur charges avec régularisation annuelle',
	jourEcheance: 1,
	revision: 'Indice IRL, au 1er janvier',
	zoneTendue: 'Non',
	depotGarantie: 0,
	modePaiement: 'virement',
});
