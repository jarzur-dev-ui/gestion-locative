import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { useData } from '@/contexts/DataContext';
import { formatAmount } from '@/utils/format';
import { natureBien } from '@/utils/quittance';

import styles from './BiensPage.module.scss';

export const BiensPage = () => {
	const { baux, removeBail } = useData();
	const navigate = useNavigate();

	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<h1>Biens &amp; baux</h1>
				<Button onClick={() => navigate('/biens/nouveau')}>Ajouter un bail</Button>
			</header>

			{baux.length === 0 ? (
				<p className={styles.empty}>
					Aucun bail enregistré. Clique sur « Ajouter un bail » pour commencer.
				</p>
			) : (
				<table className={styles.table}>
					<thead>
						<tr>
							<th>Locataire</th>
							<th>Nature</th>
							<th>Adresse</th>
							<th className={styles.right}>Loyer + charges</th>
							<th className={styles.right}>Actions</th>
						</tr>
					</thead>
					<tbody>
						{baux.map((bail) => (
							<tr key={bail.id}>
								<td>{bail.locataire || '—'}</td>
								<td>{natureBien(bail.type)}</td>
								<td>
									{bail.rue} {bail.cpVille}
								</td>
								<td className={styles.right}>
									{formatAmount(bail.loyer + bail.charges)} €
								</td>
								<td className={styles.right}>
									<Button
										onClick={() => navigate(`/biens/${bail.id}`)}
										variant="outlined"
									>
										Éditer
									</Button>{' '}
									<Button
										onClick={() => {
											if (
												window.confirm(
													`Supprimer le bail « ${bail.id} » ? Cette action est définitive.`,
												)
											) {
												removeBail(bail.id);
											}
										}}
										variant="danger"
									>
										Supprimer
									</Button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
};
