import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

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
const GarantsPage = lazy(() =>
	import('@/pages/GarantsPage/GarantsPage').then((m) => ({ default: m.GarantsPage })),
);
const LocatairesPage = lazy(() =>
	import('@/pages/LocatairesPage/LocatairesPage').then((m) => ({ default: m.LocatairesPage })),
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

const PageFallback = () => (
	<div style={{ padding: '2rem' }}>
		<Skeleton lines={8} />
	</div>
);

export const App = () => (
	<Suspense fallback={<PageFallback />}>
		<Routes>
			{/* Routes publiques */}
			<Route element={<LoginPage />} path="/login" />
			<Route element={<AcceptInvitationPage />} path="/accept-invitation/:token" />

			{/* Routes bailleur — protégées par RequireAuth + filtre rôle */}
			<Route element={<RequireAuth roles={['landlord']} />}>
				<Route element={<Layout />}>
					<Route element={<Navigate replace to="/biens" />} path="/" />
					<Route element={<BiensPage />} path="/biens" />
					<Route element={<BailEditPage />} path="/biens/:propertyId/baux/nouveau" />
					<Route element={<BailEditPage />} path="/biens/:propertyId/baux/:leaseId" />
					<Route element={<BailPrintPage />} path="/biens/:propertyId/baux/:leaseId/print" />
					<Route element={<LocatairesPage />} path="/locataires" />
					<Route element={<GarantsPage />} path="/garants" />
					<Route element={<QuittancesPage />} path="/quittances" />
					<Route element={<ReglagesPage />} path="/reglages" />
				</Route>
			</Route>

			{/* Routes locataire/garant — vue Mon dossier */}
			<Route element={<RequireAuth roles={['tenant', 'guarantor']} />}>
				<Route element={<Layout />}>
					<Route element={<MonDossierPage />} path="/mon-dossier" />
				</Route>
			</Route>

			{/* Fallback : 404 → login (qui redirige ensuite vers la home selon le rôle si auth) */}
			<Route element={<Navigate replace to="/login" />} path="*" />
		</Routes>
	</Suspense>
);
