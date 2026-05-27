import { useState } from 'react';
import {
	useNavigate,
	useParams,
} from 'react-router-dom';

import { Button } from '@/components/Button/Button';
import { TextField } from '@/components/TextField/TextField';
import { useData } from '@/contexts/DataContext';
import { BailDocument } from '@/documents/BailDocument/BailDocument';
import { todayIso } from '@/utils/format';

import styles from './PrintPage.module.scss';

export const BailPrintPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { getBail, bailleur } = useData();
	const bail = id ? getBail(id) : undefined;

	const [lieu, setLieu] = useState(bailleur.lieuSignature);
	const [dateSignature, setDateSignature] = useState(todayIso());

	if (!bail) {
		return (
			<div className={styles.toolbar}>
				<p>Bail introuvable.</p>
				<Button onClick={() => navigate('/biens')}>Retour</Button>
			</div>
		);
	}

	return (
		<div className={styles.wrap}>
			<div className={`${styles.toolbar} no-print`}>
				<Button onClick={() => navigate(`/biens/${bail.id}`)} variant="ghost">
					← Retour
				</Button>
				<TextField
					label="Lieu de signature"
					onChange={(e) => setLieu(e.target.value)}
					value={lieu}
				/>
				<TextField
					label="Date de signature"
					onChange={(e) => setDateSignature(e.target.value)}
					type="date"
					value={dateSignature}
				/>
				<Button onClick={() => window.print()}>Imprimer / PDF</Button>
			</div>

			<div className="print-area">
				<BailDocument
					bail={bail}
					bailleur={bailleur}
					dateSignature={dateSignature}
					lieuSignature={lieu}
				/>
			</div>
		</div>
	);
};
