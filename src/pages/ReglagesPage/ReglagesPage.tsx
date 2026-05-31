import {
	useRef,
	type ChangeEvent,
} from 'react';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useData } from '@/contexts/DataContext';

import styles from './ReglagesPage.module.scss';

export const ReglagesPage = () => {
	const { bailleur, setBailleur } = useData();
	const fileRef = useRef<HTMLInputElement>(null);

	const onSignature = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			setBailleur({ ...bailleur, signatureDataUrl: String(reader.result) });
		};
		reader.readAsDataURL(file);
	};

	return (
		<div className={styles.page}>
			<h1>Réglages</h1>
			<p className={styles.intro}>
				Tes coordonnées de bailleur et ta signature, utilisées sur les baux et les
				quittances. Tout reste enregistré dans ton navigateur.
			</p>

			<section className={styles.grid}>
				<TextField
					label="Nom du bailleur"
					onChange={(e) => setBailleur({ ...bailleur, nom: e.target.value })}
					value={bailleur.nom}
				/>
				<TextField
					label="Email (optionnel)"
					onChange={(e) => setBailleur({ ...bailleur, email: e.target.value })}
					value={bailleur.email}
				/>
				<TextField
					label="Adresse"
					onChange={(e) => setBailleur({ ...bailleur, adresse: e.target.value })}
					value={bailleur.adresse}
				/>
				<TextField
					label="Code postal + ville"
					onChange={(e) => setBailleur({ ...bailleur, cpVille: e.target.value })}
					value={bailleur.cpVille}
				/>
				<TextField
					label="Lieu de signature"
					onChange={(e) =>
						setBailleur({ ...bailleur, lieuSignature: e.target.value })
					}
					value={bailleur.lieuSignature}
				/>
			</section>

			<section className={styles.signature}>
				<h2>Signature</h2>
				{bailleur.signatureDataUrl ? (
					<img
						alt="signature"
						className={styles.preview}
						src={bailleur.signatureDataUrl}
					/>
				) : (
					<p className={styles.muted}>Aucune signature importée.</p>
				)}
				<input
					accept="image/png,image/jpeg"
					hidden
					onChange={onSignature}
					ref={fileRef}
					type="file"
				/>
				<div className={styles.actions}>
					<Button onClick={() => fileRef.current?.click()} variant="outlined">
						Importer une image
					</Button>
					{bailleur.signatureDataUrl ? (
						<Button
							onClick={() => setBailleur({ ...bailleur, signatureDataUrl: '' })}
							variant="ghost"
						>
							Retirer
						</Button>
					) : null}
				</div>
			</section>
		</div>
	);
};
