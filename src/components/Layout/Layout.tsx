import classNames from 'classnames';
import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth, useLogout, type UserRole } from '@/api/auth';
import { Button } from '@/components/Button';

import styles from './Layout.module.scss';

const navClass = ({ isActive }: { isActive: boolean }): string =>
	classNames(styles.link, { [styles.active]: isActive });

// Icônes de la barre latérale (état replié = icône seule).
const ICONS: Record<string, ReactNode> = {
	biens: (
		<svg viewBox="0 0 24 24">
			<path d="M3 10.5 12 3l9 7.5" />
			<path d="M5 9.5V21h14V9.5" />
		</svg>
	),
	locataires: (
		<svg viewBox="0 0 24 24">
			<circle cx="9" cy="8" r="3" />
			<path d="M3 20a6 6 0 0 1 12 0" />
			<path d="M16 6a3 3 0 0 1 0 6" />
			<path d="M20 20a6 6 0 0 0-4-5.5" />
		</svg>
	),
	garants: (
		<svg viewBox="0 0 24 24">
			<path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" />
			<path d="M9 12l2 2 4-4" />
		</svg>
	),
	quittances: (
		<svg viewBox="0 0 24 24">
			<path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21z" />
			<path d="M9 8h6M9 12h6" />
		</svg>
	),
	reglages: (
		<svg viewBox="0 0 24 24">
			<circle cx="12" cy="12" r="3" />
			<path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" />
		</svg>
	),
	migration: (
		<svg viewBox="0 0 24 24">
			<path d="M12 3v12" />
			<path d="M8 11l4 4 4-4" />
			<path d="M4 21h16" />
		</svg>
	),
	dossier: (
		<svg viewBox="0 0 24 24">
			<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
		</svg>
	),
};

interface NavLinkSpec {
	to: string;
	label: string;
	icon: ReactNode;
	roles: UserRole[];
}

const NAV_LINKS: NavLinkSpec[] = [
	{ to: '/biens', label: 'Biens & baux', icon: ICONS.biens, roles: ['landlord'] },
	{ to: '/locataires', label: 'Locataires', icon: ICONS.locataires, roles: ['landlord'] },
	{ to: '/garants', label: 'Garants', icon: ICONS.garants, roles: ['landlord'] },
	{ to: '/quittances', label: 'Quittances', icon: ICONS.quittances, roles: ['landlord'] },
	{ to: '/reglages', label: 'Réglages', icon: ICONS.reglages, roles: ['landlord'] },
	{ to: '/migration', label: 'Import V1', icon: ICONS.migration, roles: ['landlord'] },
	{ to: '/mon-dossier', label: 'Mon dossier', icon: ICONS.dossier, roles: ['tenant', 'guarantor'] },
];

export const Layout = () => {
	const { data: user } = useAuth();
	const navigate = useNavigate();
	const logoutMutation = useLogout();
	const [menuOpen, setMenuOpen] = useState(false);
	const [railPinned, setRailPinned] = useState(false);

	const onLogout = (): void => {
		logoutMutation.mutate(undefined, {
			onSettled: () => navigate('/login', { replace: true }),
		});
	};

	const visibleLinks = user ? NAV_LINKS.filter((l) => l.roles.includes(user.role)) : [];

	const navLinks = visibleLinks.map((link) => (
		<NavLink className={navClass} key={link.to} onClick={() => setMenuOpen(false)} to={link.to}>
			<span className={styles.icon}>{link.icon}</span>
			<span className={styles.label}>{link.label}</span>
		</NavLink>
	));

	return (
		<div className={styles.app}>
			{/* Rail latéral gauche (desktop) : replié en icônes, déplié au survol ou épinglé. */}
			<aside className={classNames(styles.rail, { [styles.pinned]: railPinned }, 'no-print')}>
				<div className={styles.railTop}>
					<span className={styles.brandMark}>
						<span className={styles.icon}>{ICONS.biens}</span>
						<span className={styles.brandText}>gestion-locative</span>
					</span>
					<button
						aria-label={railPinned ? 'Détacher le menu' : 'Épingler le menu'}
						aria-pressed={railPinned}
						className={styles.pin}
						onClick={() => setRailPinned((v) => !v)}
						type="button"
					>
						<svg viewBox="0 0 24 24">
							{railPinned ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 6l6 6-6 6" />}
						</svg>
					</button>
				</div>
				<nav className={styles.railNav}>{navLinks}</nav>
				<div className={styles.userBlock}>
					{user ? <span className={styles.userEmail}>{user.email}</span> : null}
					<button
						className={styles.logout}
						disabled={logoutMutation.isPending}
						onClick={onLogout}
						type="button"
					>
						<span className={styles.icon}>
							<svg viewBox="0 0 24 24">
								<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
								<path d="M10 17l-5-5 5-5" />
								<path d="M5 12h11" />
							</svg>
						</span>
						<span className={styles.label}>
							{logoutMutation.isPending ? '…' : 'Déconnexion'}
						</span>
					</button>
				</div>
			</aside>

			{/* Header haut + menu plein écran (mobile). */}
			<header className={classNames(styles.header, 'no-print')}>
				<div className={styles.brand}>gestion-locative</div>
				<button
					aria-controls="main-menu"
					aria-expanded={menuOpen}
					aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
					className={styles.burger}
					onClick={() => setMenuOpen((open) => !open)}
					type="button"
				>
					<span className={styles.burgerIcon} />
				</button>
				<div
					className={classNames(styles.menu, { [styles.menuOpen]: menuOpen })}
					id="main-menu"
				>
					<nav className={styles.nav}>{navLinks}</nav>
					<div className={styles.userBlock}>
						{user ? <span className={styles.userEmail}>{user.email}</span> : null}
						<Button disabled={logoutMutation.isPending} onClick={onLogout} variant="ghost">
							{logoutMutation.isPending ? '…' : 'Déconnexion'}
						</Button>
					</div>
				</div>
			</header>

			<main className={styles.main}>
				<Outlet />
			</main>
		</div>
	);
};
