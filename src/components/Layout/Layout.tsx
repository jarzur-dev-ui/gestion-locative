import classNames from 'classnames';
import {
	NavLink,
	Outlet,
} from 'react-router-dom';

import styles from './Layout.module.scss';

const navClass = ({ isActive }: { isActive: boolean }): string =>
	classNames(styles.link, { [styles.active]: isActive });

export const Layout = () => (
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
		</header>
		<main className={styles.main}>
			<Outlet />
		</main>
	</div>
);
