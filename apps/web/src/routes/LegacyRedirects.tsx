import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { API_BASE_URL } from '@/api/client';
import { Skeleton } from '@/components/Skeleton';
import { paths } from '@/config/routes';

// Anciens liens sans préfixe de langue : on garde la redirection côté front
// plutôt que de toucher l'API, car des emails sont déjà partis.

export const LegacyTokenRedirect = ({ to }: { to: (token: string) => string }) => {
	const { token = '' } = useParams();
	return <Navigate replace to={to(token)} />;
};

// Le lien d'avis d'échéance vise des locataires : « Mon dossier » liste leurs baux.
export const LegacyLeaseRedirect = () => <Navigate replace to={paths.monDossier()} />;

// Le fichier partagé est servi par l'API, pas par la SPA.
export const LegacyShareRedirect = () => {
	const { token = '' } = useParams();
	useEffect(() => {
		window.location.replace(`${API_BASE_URL}/share/${encodeURIComponent(token)}`);
	}, [token]);
	return (
		<div style={{ padding: '2rem' }}>
			<Skeleton lines={8} />
		</div>
	);
};
