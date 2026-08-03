import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { paths } from '@/config/routes';

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
	const { t } = useTranslation();
	const { propertyId, leaseId } = useParams<{ propertyId: string; leaseId: string }>();
	const navigate = useNavigate();

	const leaseQ = useLease(leaseId);
	const propertyQ = useProperty(propertyId);
	const landlordQ = useLandlordProfile();

	const [lieu, setLieu] = useState('');
	const [dateSignature, setDateSignature] = useState(todayIso());
	const [bailleurSig, setBailleurSig] = useState('');
	const [locataireSig, setLocataireSig] = useState('');
	const [bailleurMention, setBailleurMention] = useState(t('baux.print.defaultMention'));
	const [locataireMention, setLocataireMention] = useState(t('baux.print.defaultMention'));

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
				<p>{t('baux.print.leaseNotFound')}</p>
				<Button onPress={() => navigate(paths.biens())}>{t('baux.actions.backPlain')}</Button>
			</div>
		);
	}

	if (!landlordQ.data) {
		return (
			<div className={styles.toolbar}>
				<p>{t('baux.print.landlordProfileIncomplete')}</p>
				<Button onPress={() => navigate(paths.reglages())}>{t('baux.print.goToSettings')}</Button>
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
				<Button onPress={() => navigate(paths.leaseEdit(propertyId, leaseId))} variant="ghost">
					{t('baux.actions.back')}
				</Button>
				<TextField
					label={t('baux.print.placeLabel')}
					onChange={(e) => setLieu(e.target.value)}
					value={effectiveLieu}
				/>
				<TextField
					label={t('baux.print.dateLabel')}
					onChange={(e) => setDateSignature(e.target.value)}
					type="date"
					value={dateSignature}
				/>
				<Button onPress={() => window.print()}>{t('baux.print.printButton')}</Button>
			</div>

			<div className={`${styles.sigs} no-print`}>
				<div className={styles.sigCol}>
					<TextField
						hint={t('baux.print.mentionHint')}
						label={t('baux.print.bailleurMentionLabel')}
						onChange={(e) => setBailleurMention(e.target.value)}
						value={bailleurMention}
					/>
					<SignaturePad
						label={t('baux.print.bailleurSignatureLabel')}
						onChange={setBailleurSig}
						value={bailleurSig}
					/>
				</div>
				<div className={styles.sigCol}>
					<TextField
						hint={t('baux.print.mentionHint')}
						label={t('baux.print.locataireMentionLabel')}
						onChange={(e) => setLocataireMention(e.target.value)}
						value={locataireMention}
					/>
					<SignaturePad
						label={t('baux.print.locataireSignatureLabel')}
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
