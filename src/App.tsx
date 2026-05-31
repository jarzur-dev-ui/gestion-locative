import { Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { AcceptInvitationPage } from '@/pages/AcceptInvitationPage/AcceptInvitationPage';
import { BailEditPage } from '@/pages/BailEditPage/BailEditPage';
import { BailPrintPage } from '@/pages/BailPrintPage/BailPrintPage';
import { BiensPage } from '@/pages/BiensPage/BiensPage';
import { LoginPage } from '@/pages/LoginPage/LoginPage';
import { QuittancesPage } from '@/pages/QuittancesPage/QuittancesPage';
import { ReglagesPage } from '@/pages/ReglagesPage/ReglagesPage';

export const App = () => (
	<Routes>
		{/* Routes publiques */}
		<Route element={<LoginPage />} path="/login" />
		<Route element={<AcceptInvitationPage />} path="/accept-invitation/:token" />

		{/* Routes bailleur — protégées par RequireAuth + filtre rôle */}
		<Route element={<RequireAuth roles={['landlord']} />}>
			<Route element={<Layout />}>
				<Route element={<Navigate replace to="/biens" />} path="/" />
				<Route element={<BiensPage />} path="/biens" />
				<Route element={<BailEditPage />} path="/biens/nouveau" />
				<Route element={<BailEditPage />} path="/biens/:id" />
				<Route element={<BailPrintPage />} path="/biens/:id/bail" />
				<Route element={<QuittancesPage />} path="/quittances" />
				<Route element={<ReglagesPage />} path="/reglages" />
			</Route>
		</Route>

		{/* Fallback : 404 → login (qui redirige ensuite vers la home selon le rôle si auth) */}
		<Route element={<Navigate replace to="/login" />} path="*" />
	</Routes>
);
