import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { type UserRole, useAuth } from '@/api/auth';
import { paths } from '@/config/routes';

import styles from './RequireAuth.module.scss';

interface RequireAuthProps {
	/**
	 * Si renseigné, seuls les utilisateurs avec un de ces rôles passent.
	 * Sinon n'importe quel utilisateur authentifié passe.
	 */
	roles?: UserRole[];
}

export const RequireAuth = ({ roles }: RequireAuthProps) => {
	const { t } = useTranslation();
	const { data: user, isLoading, isError } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return <div className={styles.loading}>{t('common.loading')}</div>;
	}

	if (isError || !user) {
		return <Navigate replace state={{ from: location }} to={paths.login()} />;
	}

	if (roles && !roles.includes(user.role)) {
		return <div className={styles.forbidden}>{t('common.accessDenied')}</div>;
	}

	return <Outlet />;
};
