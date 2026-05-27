import {
	Navigate,
	Route,
	Routes,
} from 'react-router-dom';

import { Layout } from '@/components/Layout/Layout';
import { BailEditPage } from '@/pages/BailEditPage/BailEditPage';
import { BailPrintPage } from '@/pages/BailPrintPage/BailPrintPage';
import { BiensPage } from '@/pages/BiensPage/BiensPage';
import { QuittancesPage } from '@/pages/QuittancesPage/QuittancesPage';
import { ReglagesPage } from '@/pages/ReglagesPage/ReglagesPage';

export const App = () => (
	<Routes>
		<Route element={<Layout />}>
			<Route element={<Navigate replace to="/biens" />} path="/" />
			<Route element={<BiensPage />} path="/biens" />
			<Route element={<BailEditPage />} path="/biens/nouveau" />
			<Route element={<BailEditPage />} path="/biens/:id" />
			<Route element={<BailPrintPage />} path="/biens/:id/bail" />
			<Route element={<QuittancesPage />} path="/quittances" />
			<Route element={<ReglagesPage />} path="/reglages" />
			<Route element={<Navigate replace to="/biens" />} path="*" />
		</Route>
	</Routes>
);
