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
	const [bailleurMention, setBailleurMention] = useState(t('leases.print.defaultMention'));
	const [locataireMention, setLocataireMention] = useState(t('leases.print.defaultMention'));

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
				<p>{t('leases.print.leaseNotFound')}</p>
				<Button onPress={() => navigate(paths.biens())}>{t('leases.actions.backPlain')}</Button>
			</div>
		);
	}

	if (!landlordQ.data) {
		return (
			<div className={styles.toolbar}>
				<p>{t('leases.print.landlordProfileIncomplete')}</p>
				<Button onPress={() => navigate(paths.reglages())}>{t('leases.print.goToSettings')}</Button>
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
					{t('leases.actions.back')}
				</Button>
				<TextField
					label={t('leases.print.placeLabel')}
					onChange={(e) => setLieu(e.target.value)}
					value={effectiveLieu}
				/>
				<TextField
					label={t('leases.print.dateLabel')}
					onChange={(e) => setDateSignature(e.target.value)}
					type="date"
					value={dateSignature}
				/>
				<Button onPress={() => window.print()}>{t('leases.print.printButton')}</Button>
			</div>

			<div className={`${styles.sigs} no-print`}>
				<div className={styles.sigCol}>
					<TextField
						hint={t('leases.print.mentionHint')}
						label={t('leases.print.landlordMentionLabel')}
						onChange={(e) => setBailleurMention(e.target.value)}
						value={bailleurMention}
					/>
					<SignaturePad
						label={t('leases.print.landlordSignatureLabel')}
						onChange={setBailleurSig}
						value={bailleurSig}
					/>
				</div>
				<div className={styles.sigCol}>
					<TextField
						hint={t('leases.print.mentionHint')}
						label={t('leases.print.tenantMentionLabel')}
						onChange={(e) => setLocataireMention(e.target.value)}
						value={locataireMention}
					/>
					<SignaturePad
						label={t('leases.print.tenantSignatureLabel')}
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
