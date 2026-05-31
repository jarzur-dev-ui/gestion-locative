import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { type UserRole, useAuth } from '@/api/auth';

import styles from './RequireAuth.module.scss';

interface RequireAuthProps {
	/**
	 * Si renseigné, seuls les utilisateurs avec un de ces rôles passent.
	 * Sinon n'importe quel utilisateur authentifié passe.
	 */
	roles?: UserRole[];
}

export const RequireAuth = ({ roles }: RequireAuthProps) => {
	const { data: user, isLoading, isError } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return <div className={styles.loading}>Chargement…</div>;
	}

	if (isError || !user) {
		return <Navigate replace state={{ from: location }} to="/login" />;
	}

	if (roles && !roles.includes(user.role)) {
		return <div className={styles.forbidden}>Accès refusé : ton rôle ne permet pas d'accéder à cette page.</div>;
	}

	return <Outlet />;
};
