import classNames from 'classnames';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth, useLogout, type UserRole } from '@/api/auth';
import { Button } from '@/components/Button';

import styles from './Layout.module.scss';

const navClass = ({ isActive }: { isActive: boolean }): string =>
	classNames(styles.link, { [styles.active]: isActive });

interface NavLinkSpec {
	to: string;
	label: string;
	roles: UserRole[];
}

const NAV_LINKS: NavLinkSpec[] = [
	{ to: '/biens', label: 'Biens & baux', roles: ['landlord'] },
	{ to: '/locataires', label: 'Locataires', roles: ['landlord'] },
	{ to: '/garants', label: 'Garants', roles: ['landlord'] },
	{ to: '/quittances', label: 'Quittances', roles: ['landlord'] },
	{ to: '/reglages', label: 'Réglages', roles: ['landlord'] },
	{ to: '/migration', label: 'Import V1', roles: ['landlord'] },
	{ to: '/mon-dossier', label: 'Mon dossier', roles: ['tenant', 'guarantor'] },
];

export const Layout = () => {
	const { data: user } = useAuth();
	const navigate = useNavigate();
	const logoutMutation = useLogout();

	const onLogout = (): void => {
		logoutMutation.mutate(undefined, {
			onSettled: () => navigate('/login', { replace: true }),
		});
	};

	const visibleLinks = user ? NAV_LINKS.filter((l) => l.roles.includes(user.role)) : [];

	return (
		<div className={styles.app}>
			<header className={classNames(styles.header, 'no-print')}>
				<div className={styles.brand}>gestion-locative</div>
				<nav className={styles.nav}>
					{visibleLinks.map((link) => (
						<NavLink className={navClass} key={link.to} to={link.to}>
							{link.label}
						</NavLink>
					))}
				</nav>
				<div className={styles.userBlock}>
					{user ? <span className={styles.userEmail}>{user.email}</span> : null}
					<Button disabled={logoutMutation.isPending} onClick={onLogout} variant="ghost">
						{logoutMutation.isPending ? '…' : 'Déconnexion'}
					</Button>
				</div>
			</header>
			<main className={styles.main}>
				<Outlet />
			</main>
		</div>
	);
};
