import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { SUPPORTED_LANGUAGES } from '@/config/i18n';
import { localizePath } from '@/config/routes';

import styles from './LanguageSwitcher.module.scss';

/**
 * Sélecteur segmenté FR / EN. Change la langue en naviguant vers l'URL localisée
 * équivalente (préfixe + slugs traduits) ; le LangGate aligne alors i18next.
 */
export const LanguageSwitcher = ({ className }: { className?: string }) => {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();

	return (
		<div
			aria-label={t('layout.language')}
			className={classNames(styles.switcher, className)}
			role="group"
		>
			{SUPPORTED_LANGUAGES.map((lng) => {
				const active = i18n.resolvedLanguage === lng;
				return (
					<button
						aria-pressed={active}
						className={classNames(styles.option, { [styles.active]: active })}
						key={lng}
						onClick={() => navigate(localizePath(location.pathname, lng) + location.search)}
						type="button"
					>
						{lng.slice(0, 2).toUpperCase()}
					</button>
				);
			})}
		</div>
	);
};
