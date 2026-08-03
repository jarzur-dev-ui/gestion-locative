import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enUS from '@/translations/en-US';
import frFR from '@/translations/fr-FR';

export const SUPPORTED_LANGUAGES = ['fr-FR', 'en-US'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
	'fr-FR': 'Français',
	'en-US': 'English',
};

// Namespace unique `translation` ; les catalogues sont bundlés (2 langues, petits).
export const DEFAULT_NS = 'translation';

void i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			'fr-FR': { translation: frFR },
			'en-US': { translation: enUS },
		},
		fallbackLng: 'fr-FR',
		supportedLngs: SUPPORTED_LANGUAGES,
		load: 'currentOnly',
		interpolation: { escapeValue: false }, // React échappe déjà.
		detection: {
			order: ['localStorage', 'navigator'],
			caches: ['localStorage'],
		},
	});

// <html lang="fr|en"> suit la langue courante (SEO / a11y).
const applyHtmlLang = (lng: string): void => {
	document.documentElement.lang = lng.split('-')[0] ?? 'fr';
};
applyHtmlLang(i18n.language);
i18n.on('languageChanged', applyHtmlLang);

// Typage : `t('layout.nav.biens')` autocomplété, erreur TS sur clé inexistante.
declare module 'i18next' {
	interface CustomTypeOptions {
		defaultNS: typeof DEFAULT_NS;
		resources: { translation: typeof frFR };
	}
}

export default i18n;
