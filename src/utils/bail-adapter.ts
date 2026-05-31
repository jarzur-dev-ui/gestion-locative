/**
 * Adapter : transforme le shape API (Lease + Property + LandlordProfile)
 * vers le shape legacy `Bail` / `Bailleur` consommé par `<BailDocument>`.
 *
 * Évite de refactorer le template d'impression — il garde l'API legacy et
 * on adapte les données d'entrée.
 */
import type { components } from '@/api/client';
import type { Bail, Bailleur, BienType, Civilite } from '@/types';

type Lease = components['schemas']['Lease'];
type Property = components['schemas']['Property'];
type LandlordProfile = components['schemas']['LandlordProfile'];

const civilityToLegacy = (civility: string | null | undefined): Civilite => {
	if (civility === 'Mme') return 'Madame';
	return 'Monsieur';
};

const propertyTypeToLegacy = (key: string): BienType => {
	if (key === 'parking' || key === 'cellar') return 'parking';
	return 'logement';
};

export function leaseToBail(lease: Lease, property: Property): Bail {
	const firstTenant = lease.tenants?.[0];
	const firstGuarantor = lease.guarantors?.[0];

	const garantLabel = firstGuarantor
		? firstGuarantor.guarantorTypeKey === 'organization'
			? (firstGuarantor.organizationName ?? '')
			: `${firstGuarantor.firstName ?? ''} ${firstGuarantor.lastName ?? ''}`.trim()
		: '';

	return {
		id: lease.id,
		// La civilité n'est pas dans LeaseTenantSummary — default 'Monsieur'.
		// Pour récupérer la vraie civilité, requêter tenants séparément ; non critique
		// pour le print V1 (le bailleur peut la corriger à la main avant impression si besoin).
		civilite: civilityToLegacy(null),
		locataire: firstTenant ? `${firstTenant.firstName} ${firstTenant.lastName}` : '',
		locataireEmail: firstTenant?.email ?? '',
		garant: garantLabel,

		type: propertyTypeToLegacy(property.propertyTypeKey),
		rue: property.addressLine,
		cpVille: `${property.postalCode} ${property.city}`,
		batiment: '',
		typeImmeuble: '',
		regime: '',
		periodeConstruction: property.builtYear ? String(property.builtYear) : '',
		surface: property.surfaceM2 != null ? String(property.surfaceM2) : '',
		nbPieces: property.roomCount != null ? String(property.roomCount) : '',
		chauffage: '',
		eauChaude: '',
		accessoires: '',
		identifiantFiscal: '',
		dpe: property.dpeGrade ?? '',

		dateEffet: lease.startDate,
		duree: lease.endDate
			? `Jusqu'au ${lease.endDate}`
			: lease.leaseTypeKey === 'furnished'
				? '1 an'
				: '3 ans',

		loyer: lease.monthlyRentCents / 100,
		charges: lease.monthlyChargesCents / 100,
		modaliteCharges: lease.chargesTypeKey === 'package' ? 'Forfait' : 'Provisions sur charges réelles',
		jourEcheance: lease.paymentDay,
		revision: '',
		zoneTendue: '',
		depotGarantie: lease.depositCents / 100,
		modePaiement: 'Virement bancaire',
	};
}

export function landlordProfileToBailleur(profile: LandlordProfile): Bailleur {
	const civPrefix = profile.civility ? `${profile.civility} ` : '';
	return {
		nom: `${civPrefix}${profile.firstName} ${profile.lastName}`.trim(),
		adresse: profile.addressLine,
		cpVille: `${profile.postalCode} ${profile.city}`,
		email: profile.email ?? '',
		lieuSignature: profile.city,
		signatureDataUrl: '', // TODO M6+ : endpoint d'upload signature dédié pas encore en place
	};
}
