import i18n, { SUPPORTED_LANGUAGES, type AppLanguage } from '@/config/i18n';

// Segments de chemin localisés par identifiant de route.
// La langue est portée par le préfixe d'URL (/fr-FR/…, /en-US/…) et les slugs
// sont traduits (« URLs en anglais »).
export const SEGMENTS = {
	login: { 'fr-FR': 'connexion', 'en-US': 'login' },
	forgotPassword: { 'fr-FR': 'mot-de-passe-oublie', 'en-US': 'forgot-password' },
	resetPassword: { 'fr-FR': 'reinitialiser', 'en-US': 'reset-password' },
	acceptInvitation: { 'fr-FR': 'invitation', 'en-US': 'accept-invitation' },
	biens: { 'fr-FR': 'biens', 'en-US': 'properties' },
	locataires: { 'fr-FR': 'locataires', 'en-US': 'tenants' },
	garants: { 'fr-FR': 'garants', 'en-US': 'guarantors' },
	quittances: { 'fr-FR': 'quittances', 'en-US': 'rent-receipts' },
	reglages: { 'fr-FR': 'reglages', 'en-US': 'settings' },
	migration: { 'fr-FR': 'migration', 'en-US': 'import' },
	monDossier: { 'fr-FR': 'mon-dossier', 'en-US': 'my-file' },
	baux: { 'fr-FR': 'baux', 'en-US': 'leases' },
	nouveau: { 'fr-FR': 'nouveau', 'en-US': 'new' },
	print: { 'fr-FR': 'imprimer', 'en-US': 'print' },
} as const;

export type RouteId = keyof typeof SEGMENTS;

export const DEFAULT_LANGUAGE: AppLanguage = 'fr-FR';

export const isSupportedLanguage = (value: string | undefined): value is AppLanguage =>
	SUPPORTED_LANGUAGES.includes(value as AppLanguage);

const seg = (id: RouteId, lang: AppLanguage): string => SEGMENTS[id][lang];

/** Langue courante (résolue par i18next), avec repli sur la langue par défaut. */
const currentLang = (): AppLanguage => {
	const lng = i18n.resolvedLanguage ?? i18n.language;
	return isSupportedLanguage(lng) ? lng : DEFAULT_LANGUAGE;
};

const build = (lang: AppLanguage, ...ids: RouteId[]): string =>
	`/${lang}/${ids.map((id) => seg(id, lang)).join('/')}`;

/**
 * Constructeurs de chemins localisés. Chacun lit la langue courante au moment
 * de l'appel → pas besoin de passer la langue aux call-sites.
 */
export const paths = {
	root: (): string => `/${currentLang()}`,
	login: (): string => build(currentLang(), 'login'),
	forgotPassword: (): string => build(currentLang(), 'forgotPassword'),
	biens: (): string => build(currentLang(), 'biens'),
	locataires: (): string => build(currentLang(), 'locataires'),
	garants: (): string => build(currentLang(), 'garants'),
	quittances: (): string => build(currentLang(), 'quittances'),
	reglages: (): string => build(currentLang(), 'reglages'),
	migration: (): string => build(currentLang(), 'migration'),
	monDossier: (): string => build(currentLang(), 'monDossier'),
	// propertyId / leaseId proviennent de params de route garantis par le
	// pattern (:propertyId, :leaseId) → toujours présents à l'appel.
	leaseNew: (propertyId: string | undefined): string => {
		const l = currentLang();
		return `${build(l, 'biens')}/${propertyId}/${seg('baux', l)}/${seg('nouveau', l)}`;
	},
	leaseEdit: (propertyId: string | undefined, leaseId: string | undefined): string => {
		const l = currentLang();
		return `${build(l, 'biens')}/${propertyId}/${seg('baux', l)}/${leaseId}`;
	},
	leasePrint: (propertyId: string | undefined, leaseId: string | undefined): string => {
		const l = currentLang();
		return `${build(l, 'biens')}/${propertyId}/${seg('baux', l)}/${leaseId}/${seg('print', l)}`;
	},
};

// Réécrit un chemin d'une langue vers une autre (utilisé par le sélecteur de
// langue) : remplace le préfixe et re-traduit chaque segment de slug connu.
// Les segments inconnus (identifiants, tokens) sont conservés tels quels.
export const localizePath = (pathname: string, toLang: AppLanguage): string => {
	const parts = pathname.split('/').filter(Boolean);
	if (parts.length === 0) return `/${toLang}`;

	const fromLang: AppLanguage = isSupportedLanguage(parts[0]) ? parts[0] : DEFAULT_LANGUAGE;
	const rest = isSupportedLanguage(parts[0]) ? parts.slice(1) : parts;

	const translated = rest.map((segment) => {
		const id = (Object.keys(SEGMENTS) as RouteId[]).find(
			(key) => SEGMENTS[key][fromLang] === segment,
		);
		return id ? SEGMENTS[id][toLang] : segment;
	});

	return `/${[toLang, ...translated].join('/')}`;
};
