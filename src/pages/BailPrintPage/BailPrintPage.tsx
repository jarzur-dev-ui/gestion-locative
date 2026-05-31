// ⚠ M6 Phase 3 — TODO migration localStorage → API
// Cette page utilise encore `useData()` / DataContext + l'ancien shape Bail.
// Migration prévue : useLease + useLandlordProfile + adapter pour BailDocument.
// L'app fonctionne en hybride pour l'instant.
import { useState } from 'react';
import {
	useNavigate,
	useParams,
} from 'react-router-dom';

import { Button } from '@/components/Button';
import { SignaturePad } from '@/components/SignaturePad';
import { TextField } from '@/components/TextField';
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
	const [bailleurSig, setBailleurSig] = useState(bailleur.signatureDataUrl);
	const [locataireSig, setLocataireSig] = useState('');
	const [bailleurMention, setBailleurMention] = useState('Lu et approuvé');
	const [locataireMention, setLocataireMention] = useState('Lu et approuvé');

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

			<div className={`${styles.sigs} no-print`}>
				<div className={styles.sigCol}>
					<TextField
						hint="Affiché en cursive au-dessus de la signature. Vider pour signer à la main."
						label="Mention « Lu et approuvé » — bailleur"
						onChange={(e) => setBailleurMention(e.target.value)}
						value={bailleurMention}
					/>
					<SignaturePad
						label="Signature du bailleur"
						onChange={setBailleurSig}
						value={bailleurSig}
					/>
				</div>
				<div className={styles.sigCol}>
					<TextField
						hint="Affiché en cursive au-dessus de la signature. Vider pour signer à la main."
						label="Mention « Lu et approuvé » — locataire"
						onChange={(e) => setLocataireMention(e.target.value)}
						value={locataireMention}
					/>
					<SignaturePad
						label="Signature du locataire"
						onChange={setLocataireSig}
						value={locataireSig}
					/>
				</div>
			</div>

			<div className="print-area">
				<BailDocument
					bail={bail}
					bailleur={bailleur}
					bailleurMention={bailleurMention}
					bailleurSignatureDataUrl={bailleurSig}
					dateSignature={dateSignature}
					lieuSignature={lieu}
					locataireMention={locataireMention}
					locataireSignatureDataUrl={locataireSig}
				/>
			</div>
		</div>
	);
};
