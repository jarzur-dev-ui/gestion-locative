import classNames from 'classnames';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth, useLogout } from '@/api/auth';
import { Button } from '@/components/Button';

import styles from './Layout.module.scss';

const navClass = ({ isActive }: { isActive: boolean }): string =>
	classNames(styles.link, { [styles.active]: isActive });

export const Layout = () => {
	const { data: user } = useAuth();
	const navigate = useNavigate();
	const logoutMutation = useLogout();

	const onLogout = (): void => {
		logoutMutation.mutate(undefined, {
			onSettled: () => navigate('/login', { replace: true }),
		});
	};

	return (
		<div className={styles.app}>
			<header className={classNames(styles.header, 'no-print')}>
				<div className={styles.brand}>gestion-locative</div>
				<nav className={styles.nav}>
					<NavLink className={navClass} to="/biens">
						Biens &amp; baux
					</NavLink>
					<NavLink className={navClass} to="/quittances">
						Quittances
					</NavLink>
					<NavLink className={navClass} to="/reglages">
						Réglages
					</NavLink>
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
