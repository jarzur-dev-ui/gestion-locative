import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useLandlordProfile } from '@/api/landlord-profiles';
import { useLease } from '@/api/leases';
import { useProperty } from '@/api/properties';
import { Button } from '@/components/Button';
import { SignaturePad } from '@/components/SignaturePad';
import { Skeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { BailDocument } from '@/documents/BailDocument/BailDocument';
import { landlordProfileToBailleur, leaseToBail } from '@/utils/bail-adapter';
import { todayIso } from '@/utils/format';

import styles from './PrintPage.module.scss';

export const BailPrintPage = () => {
	const { propertyId, leaseId } = useParams<{ propertyId: string; leaseId: string }>();
	const navigate = useNavigate();

	const leaseQ = useLease(leaseId);
	const propertyQ = useProperty(propertyId);
	const landlordQ = useLandlordProfile();

	const [lieu, setLieu] = useState('');
	const [dateSignature, setDateSignature] = useState(todayIso());
	const [bailleurSig, setBailleurSig] = useState('');
	const [locataireSig, setLocataireSig] = useState('');
	const [bailleurMention, setBailleurMention] = useState('Lu et approuvé');
	const [locataireMention, setLocataireMention] = useState('Lu et approuvé');

	if (leaseQ.isLoading || propertyQ.isLoading || landlordQ.isLoading) {
		return (
			<div className={styles.wrap}>
				<Skeleton lines={8} />
			</div>
		);
	}

	if (!leaseQ.data || !propertyQ.data) {
		return (
			<div className={styles.toolbar}>
				<p>Bail introuvable.</p>
				<Button onPress={() => navigate('/biens')}>Retour</Button>
			</div>
		);
	}

	if (!landlordQ.data) {
		return (
			<div className={styles.toolbar}>
				<p>Profil bailleur incomplet. Renseigne tes coordonnées dans Réglages avant d'imprimer un bail.</p>
				<Button onPress={() => navigate('/reglages')}>Aller aux réglages</Button>
			</div>
		);
	}

	const bail = leaseToBail(leaseQ.data, propertyQ.data);
	const bailleur = landlordProfileToBailleur(landlordQ.data);
	// Initialise `lieu` au défaut serveur si pas encore édité
	const effectiveLieu = lieu || bailleur.lieuSignature;

	return (
		<div className={styles.wrap}>
			<div className={`${styles.toolbar} no-print`}>
				<Button onPress={() => navigate(`/biens/${propertyId}/baux/${leaseId}`)} variant="ghost">
					← Retour
				</Button>
				<TextField
					label="Lieu de signature"
					onChange={(e) => setLieu(e.target.value)}
					value={effectiveLieu}
				/>
				<TextField
					label="Date de signature"
					onChange={(e) => setDateSignature(e.target.value)}
					type="date"
					value={dateSignature}
				/>
				<Button onPress={() => window.print()}>Imprimer / PDF</Button>
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
					lieuSignature={effectiveLieu}
					locataireMention={locataireMention}
					locataireSignatureDataUrl={locataireSig}
				/>
			</div>
		</div>
	);
};
