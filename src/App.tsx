import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import i18n, { SUPPORTED_LANGUAGES, type AppLanguage } from '@/config/i18n';
import { paths, SEGMENTS } from '@/config/routes';
import { Layout } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { Skeleton } from '@/components/Skeleton';
import { LoginPage } from '@/pages/LoginPage/LoginPage';

// Code splitting des routes : chaque page protégée est chargée à la demande.
// La LoginPage reste eager (premier écran possible, on optimise le LCP).
const AcceptInvitationPage = lazy(() =>
	import('@/pages/AcceptInvitationPage/AcceptInvitationPage').then((m) => ({
		default: m.AcceptInvitationPage,
	})),
);
const BailEditPage = lazy(() =>
	import('@/pages/BailEditPage/BailEditPage').then((m) => ({ default: m.BailEditPage })),
);
const BailPrintPage = lazy(() =>
	import('@/pages/BailPrintPage/BailPrintPage').then((m) => ({ default: m.BailPrintPage })),
);
const BiensPage = lazy(() =>
	import('@/pages/BiensPage/BiensPage').then((m) => ({ default: m.BiensPage })),
);
const ForgotPasswordPage = lazy(() =>
	import('@/pages/ForgotPasswordPage/ForgotPasswordPage').then((m) => ({
		default: m.ForgotPasswordPage,
	})),
);
const GarantsPage = lazy(() =>
	import('@/pages/GarantsPage/GarantsPage').then((m) => ({ default: m.GarantsPage })),
);
const LocatairesPage = lazy(() =>
	import('@/pages/LocatairesPage/LocatairesPage').then((m) => ({ default: m.LocatairesPage })),
);
const MigrationPage = lazy(() =>
	import('@/pages/MigrationPage/MigrationPage').then((m) => ({ default: m.MigrationPage })),
);
const MonDossierPage = lazy(() =>
	import('@/pages/MonDossierPage/MonDossierPage').then((m) => ({ default: m.MonDossierPage })),
);
const QuittancesPage = lazy(() =>
	import('@/pages/QuittancesPage/QuittancesPage').then((m) => ({ default: m.QuittancesPage })),
);
const ReglagesPage = lazy(() =>
	import('@/pages/ReglagesPage/ReglagesPage').then((m) => ({ default: m.ReglagesPage })),
);
const ResetPasswordPage = lazy(() =>
	import('@/pages/ResetPasswordPage/ResetPasswordPage').then((m) => ({
		default: m.ResetPasswordPage,
	})),
);

const PageFallback = () => (
	<div style={{ padding: '2rem' }}>
		<Skeleton lines={8} />
	</div>
);

// Aligne la langue i18next sur le préfixe de l'URL (/fr-FR/…, /en-US/…).
const LangGate = ({ lang }: { lang: AppLanguage }) => {
	useEffect(() => {
		if (i18n.resolvedLanguage !== lang) void i18n.changeLanguage(lang);
	}, [lang]);
	return <Outlet />;
};

// Racine / chemins inconnus → home localisée dans la langue détectée.
const RootRedirect = () => <Navigate replace to={paths.biens()} />;

const langRoutes = (lng: AppLanguage) => (
	<Route element={<LangGate lang={lng} />} key={lng} path={lng}>
		{/* Routes publiques */}
		<Route element={<LoginPage />} path={SEGMENTS.login[lng]} />
		<Route
			element={<AcceptInvitationPage />}
			path={`${SEGMENTS.acceptInvitation[lng]}/:token`}
		/>
		<Route element={<ForgotPasswordPage />} path={SEGMENTS.forgotPassword[lng]} />
		<Route element={<ResetPasswordPage />} path={`${SEGMENTS.resetPassword[lng]}/:token`} />

		{/* Routes bailleur — protégées par RequireAuth + filtre rôle */}
		<Route element={<RequireAuth roles={['landlord']} />}>
			<Route element={<Layout />}>
				<Route element={<BiensPage />} path={SEGMENTS.biens[lng]} />
				<Route
					element={<BailEditPage />}
					path={`${SEGMENTS.biens[lng]}/:propertyId/${SEGMENTS.baux[lng]}/${SEGMENTS.nouveau[lng]}`}
				/>
				<Route
					element={<BailEditPage />}
					path={`${SEGMENTS.biens[lng]}/:propertyId/${SEGMENTS.baux[lng]}/:leaseId`}
				/>
				<Route
					element={<BailPrintPage />}
					path={`${SEGMENTS.biens[lng]}/:propertyId/${SEGMENTS.baux[lng]}/:leaseId/${SEGMENTS.print[lng]}`}
				/>
				<Route element={<LocatairesPage />} path={SEGMENTS.locataires[lng]} />
				<Route element={<GarantsPage />} path={SEGMENTS.garants[lng]} />
				<Route element={<QuittancesPage />} path={SEGMENTS.quittances[lng]} />
				<Route element={<ReglagesPage />} path={SEGMENTS.reglages[lng]} />
				<Route element={<MigrationPage />} path={SEGMENTS.migration[lng]} />
			</Route>
		</Route>

		{/* Routes locataire/garant — vue Mon dossier */}
		<Route element={<RequireAuth roles={['tenant', 'guarantor']} />}>
			<Route element={<Layout />}>
				<Route element={<MonDossierPage />} path={SEGMENTS.monDossier[lng]} />
			</Route>
		</Route>

		{/* /:lang → home bailleur */}
		<Route element={<Navigate replace to={SEGMENTS.biens[lng]} />} index />
	</Route>
);

export const App = () => (
	<Suspense fallback={<PageFallback />}>
		<Routes>
			{SUPPORTED_LANGUAGES.map((lng) => langRoutes(lng))}
			<Route element={<RootRedirect />} path="/" />
			<Route element={<RootRedirect />} path="*" />
		</Routes>
	</Suspense>
);
