import classNames from 'classnames';

import type {
	Bail,
	Bailleur,
} from '@/types';
import {
	formatAmount,
	formatDateFr,
} from '@/utils/format';
import { natureBien } from '@/utils/quittance';

import styles from './BailDocument.module.scss';

export interface BailDocumentProps {
	bail: Bail;
	bailleur: Bailleur;
	lieuSignature: string;
	dateSignature: string; // ISO
	bailleurSignatureDataUrl?: string;
	locataireSignatureDataUrl?: string;
	bailleurMention?: string;
	locataireMention?: string;
}

const Row = ({ k, v }: { k: string; v: string }) => (
	<tr>
		<td className={styles.k}>{k}</td>
		<td className={styles.v}>{v || '—'}</td>
	</tr>
);

export const BailDocument = ({
	bail,
	bailleur,
	lieuSignature,
	dateSignature,
	bailleurSignatureDataUrl,
	locataireSignatureDataUrl,
	bailleurMention,
	locataireMention,
}: BailDocumentProps) => {
	const total = bail.loyer + bail.charges;
	const bienAdresse = `${bail.rue} ${bail.cpVille}`.trim();
	const emailBailleur = bailleur.email
		? `, courriel : ${bailleur.email}`
		: '';
	const emailLocataire = bail.locataireEmail
		? `, courriel : ${bail.locataireEmail}`
		: '';

	return (
		<div className={classNames('paper', styles.doc)}>
			<h1 className={styles.title}>CONTRAT DE LOCATION</h1>
			<div className={styles.subtitle}>
				Logement nu à usage de résidence principale — loi du 6 juillet 1989
			</div>

			<h2 className={styles.band}>I. Désignation des parties</h2>
			<p>
				<span className={styles.muted}>Le bailleur :</span>{' '}
				<strong>{bailleur.nom}</strong>, demeurant {bailleur.adresse},{' '}
				{bailleur.cpVille}
				{emailBailleur}. Qualité : personne physique.
			</p>
			<p>
				<span className={styles.muted}>Le locataire :</span>{' '}
				<strong>
					{bail.civilite} {bail.locataire}
				</strong>
				{emailLocataire}.
			</p>
			{bail.garant ? (
				<p>
					<span className={styles.muted}>Garant :</span>{' '}
					<strong>{bail.garant}</strong>.
				</p>
			) : null}

			<h2 className={styles.band}>II. Objet du contrat</h2>
			<table className={styles.kv}>
				<tbody>
					<Row k="Adresse du logement" v={bienAdresse} />
					<Row k="Bâtiment / étage / porte" v={bail.batiment} />
					<Row k="Type d'habitat" v={`${bail.typeImmeuble} — ${bail.regime}`} />
					<Row k="Période de construction" v={bail.periodeConstruction} />
					<Row k="Surface habitable" v={`${bail.surface} m²`} />
					<Row k="Nombre de pièces principales" v={bail.nbPieces} />
					<Row
						k="Chauffage / eau chaude"
						v={`${bail.chauffage} / ${bail.eauChaude}`}
					/>
					<Row k="Locaux accessoires" v={bail.accessoires} />
					<Row k="Nature du bien" v={natureBien(bail.type)} />
					<Row k="Identifiant fiscal du logement" v={bail.identifiantFiscal} />
					<Row k="Classe énergétique (DPE)" v={bail.dpe} />
				</tbody>
			</table>

			<h2 className={styles.band}>III. Date de prise d'effet et durée</h2>
			<table className={styles.kv}>
				<tbody>
					<Row k="Date de prise d'effet" v={formatDateFr(bail.dateEffet)} />
					<Row k="Durée du contrat" v={bail.duree} />
				</tbody>
			</table>
			<p className={styles.legal}>
				En l'absence de proposition de renouvellement, le contrat est, à son
				terme, reconduit tacitement dans les mêmes conditions. Le locataire peut
				mettre fin au bail à tout moment après avoir donné congé. Le bailleur peut
				y mettre fin à son échéance et après congé, pour reprendre le logement, le
				vendre, ou pour un motif sérieux et légitime.
			</p>

			<h2 className={styles.band}>IV. Conditions financières</h2>
			<table className={styles.kv}>
				<tbody>
					<Row k="Loyer mensuel hors charges" v={`${formatAmount(bail.loyer)} €`} />
					<Row k="Provisions sur charges" v={`${formatAmount(bail.charges)} €`} />
					<Row k="Modalité de règlement des charges" v={bail.modaliteCharges} />
					<Row k="Révision annuelle du loyer" v={bail.revision} />
					<Row k="Encadrement / zone tendue" v={bail.zoneTendue} />
				</tbody>
			</table>
			<div className={styles.montantBand}>
				Montant total mensuel dû : {formatAmount(total)} € — payable d'avance, le{' '}
				{bail.jourEcheance} de chaque mois, par {bail.modePaiement}.
			</div>

			<h2 className={styles.band}>V. Travaux</h2>
			<p className={styles.legal}>
				Aucuns travaux faisant l'objet d'une clause de majoration ou de minoration
				de loyer ne sont prévus, sauf mention contraire :
				____________________________________
			</p>

			<h2 className={styles.band}>VI. Garantie — dépôt de garantie</h2>
			<table className={styles.kv}>
				<tbody>
					<Row
						k="Montant du dépôt de garantie"
						v={`${formatAmount(bail.depotGarantie)} €`}
					/>
				</tbody>
			</table>
			<p className={styles.legal}>
				Le dépôt de garantie couvre les obligations du locataire. Son montant ne
				peut excéder un mois de loyer hors charges. Il est restitué dans les
				conditions prévues par la loi du 6 juillet 1989.
			</p>

			<h2 className={styles.band}>VII. Clause de solidarité</h2>
			<p className={styles.legal}>
				En cas de pluralité de locataires, il y a solidarité et indivisibilité
				entre eux pour l'exécution de toutes les obligations du présent contrat.
			</p>

			<h2 className={styles.band}>VIII. Clause résolutoire</h2>
			<p className={styles.legal}>
				Le présent contrat sera résilié de plein droit : en cas de défaut de
				paiement du loyer, des provisions de charges ou de la régularisation
				annuelle des charges ; en cas de défaut de versement du dépôt de garantie ;
				en cas de défaut d'assurance des risques locatifs ; en cas de trouble de
				voisinage constaté par une décision de justice passée en force de chose
				jugée.
			</p>

			<h2 className={styles.band}>IX. Honoraires de location</h2>
			<p className={styles.legal}>
				Le présent contrat étant conclu directement entre le bailleur et le
				locataire, sans l'entremise d'une personne mandatée et rémunérée, aucun
				honoraire de location n'est dû.
			</p>

			<h2 className={styles.band}>X. Autres conditions particulières</h2>
			<p className={styles.legal}>Néant.</p>

			<h2 className={styles.band}>XI. Annexes</h2>
			<p className={styles.legal}>
				Sont annexées au présent contrat : le dossier de diagnostic technique
				(dont le DPE) ; la notice d'information relative aux droits et obligations
				des locataires et des bailleurs ; l'état des lieux établi lors de la remise
				des clés ; le cas échéant, un extrait du règlement de copropriété.
			</p>

			<div className={styles.signatures}>
				<div className={styles.col}>
					<div className={styles.who}>Le bailleur</div>
					<div className={styles.mention}>
						Signature précédée de la mention « Lu et approuvé »
					</div>
					<div className={styles.sigArea}>
						{bailleurMention ? (
							<div className={styles.mentionUser}>{bailleurMention}</div>
						) : null}
						{bailleurSignatureDataUrl ? (
							<img
								alt="signature du bailleur"
								className={styles.sigImg}
								src={bailleurSignatureDataUrl}
							/>
						) : null}
					</div>
				</div>
				<div className={styles.col}>
					<div className={styles.who}>Le locataire</div>
					<div className={styles.mention}>
						Signature précédée de la mention « Lu et approuvé »
					</div>
					<div className={styles.sigArea}>
						{locataireMention ? (
							<div className={styles.mentionUser}>{locataireMention}</div>
						) : null}
						{locataireSignatureDataUrl ? (
							<img
								alt="signature du locataire"
								className={styles.sigImg}
								src={locataireSignatureDataUrl}
							/>
						) : null}
					</div>
				</div>
			</div>
			<p>
				Fait à {lieuSignature}, le {formatDateFr(dateSignature)}, en autant
				d'exemplaires originaux que de parties.
			</p>
		</div>
	);
};
