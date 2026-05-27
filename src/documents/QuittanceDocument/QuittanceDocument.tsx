import classNames from 'classnames';

import type { QuittanceVM } from '@/utils/quittance';

import styles from './QuittanceDocument.module.scss';

export interface QuittanceDocumentProps {
	vm: QuittanceVM;
}

export const QuittanceDocument = ({ vm }: QuittanceDocumentProps) => (
	<div className={classNames('paper', styles.doc)}>
		<div className={styles.topbar}>
			<div>
				<div className={styles.bailleurNom}>{vm.bailleurNom}</div>
				<div className={styles.bailleurCoord}>
					{vm.bailleurAdresse} — {vm.bailleurCpVille}
				</div>
			</div>
			<div className={styles.role}>
				Propriétaire
				<br />
				bailleur
			</div>
		</div>

		<div className={styles.cols}>
			<div className={styles.refs}>
				<div className={styles.line}>
					<span className={styles.k}>Nature du bien</span>
					<span className={styles.v}>{vm.natureBien}</span>
				</div>
				<div className={styles.line}>
					<span className={styles.k}>Adresse de la location</span>
					<span className={styles.v}>{vm.bienAdresse}</span>
				</div>
				<div className={styles.line}>
					<span className={styles.k}>Quittance n°</span>
					<span className={styles.v}>{vm.numero}</span>
				</div>
				<div className={styles.line}>
					<span className={styles.k}>Éditée le</span>
					<span className={styles.v}>{vm.dateEmission}</span>
				</div>
			</div>
			<div className={styles.tenant}>
				<div className={styles.tenantLabel}>Locataire</div>
				<div className={styles.tenantNom}>{vm.locataire}</div>
				<div>{vm.locataireRue}</div>
				<div>{vm.locataireCpVille}</div>
			</div>
		</div>

		<div className={styles.band}>
			<span>Quittance</span>
		</div>
		<p className={styles.disclaimer}>
			Cette quittance annule tous les reçus qui auraient pu être établis
			précédemment en cas de paiement partiel du montant du présent terme. Le
			paiement de la présente quittance n'emporte pas présomption de paiement des
			termes antérieurs.
		</p>
		<table className={styles.detail}>
			<thead>
				<tr>
					<th className={styles.date}>Date</th>
					<th>Libellé</th>
					<th className={styles.amount}>Montant</th>
				</tr>
			</thead>
			<tbody>
				{vm.quittanceLignes.map((ligne, i) => (
					<tr key={i}>
						<td className={styles.date}>{ligne.date}</td>
						<td>{ligne.libelle}</td>
						<td className={styles.amount}>{ligne.montant}</td>
					</tr>
				))}
				<tr className={styles.total}>
					<td className={styles.date} />
					<td>Net payé</td>
					<td className={styles.amount}>{vm.netPaye}</td>
				</tr>
			</tbody>
		</table>
		<p className={styles.reserve}>
			Quittance délivrée pour la somme reçue par {vm.modePaiement}, sans préjudice
			du terme courant et sous réserve de tous mes droits.
		</p>

		<div className={styles.band}>
			<span>Avis d'échéance</span>
			<span className={styles.echeance}>Échéance au {vm.echeance}</span>
		</div>
		<p className={styles.disclaimer}>
			La somme détaillée ci-dessous représente le montant à régler dès réception
			pour le terme à venir. Nous vous en remercions par avance.
		</p>
		<table className={styles.detail}>
			<thead>
				<tr>
					<th className={styles.date}>Date</th>
					<th>Libellé</th>
					<th className={styles.amount}>Montant</th>
				</tr>
			</thead>
			<tbody>
				{vm.avisLignes.map((ligne, i) => (
					<tr key={i}>
						<td className={styles.date}>{ligne.date}</td>
						<td>{ligne.libelle}</td>
						<td className={styles.amount}>{ligne.montant}</td>
					</tr>
				))}
				<tr className={styles.total}>
					<td className={styles.date} />
					<td>Solde débiteur</td>
					<td className={styles.amount}>{vm.soldeDebiteur}</td>
				</tr>
			</tbody>
		</table>

		<div className={styles.signatureBlock}>
			<div className={styles.lieuDate}>
				Fait à {vm.lieuSignature}, le {vm.dateEmission}
			</div>
			<span className={styles.signatureLabel}>Signature du bailleur</span>
			{vm.signatureDataUrl ? (
				<div>
					<img
						alt="signature"
						className={styles.signature}
						src={vm.signatureDataUrl}
					/>
				</div>
			) : null}
		</div>

		<div className={styles.footer}>
			Quittance à conserver pendant cinq ans par le locataire (article 2224 du
			Code civil). Document établi par le bailleur, valant reçu pour le terme
			acquitté et avis d'échéance pour le terme à venir.
		</div>
	</div>
);
