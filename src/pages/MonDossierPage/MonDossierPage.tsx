import { useState } from 'react';

import { useAuth } from '@/api/auth';
import {
	type DocumentItem,
	getDocumentDownloadUrl,
	useCreateDocumentShare,
	useDocuments,
	useDocumentTypes,
	useUploadDocument,
} from '@/api/documents';
import { useMyLeases } from '@/api/me';
import { Button } from '@/components/Button';
import { FileUpload } from '@/components/FileUpload';
import { Modal } from '@/components/Modal';
import { Skeleton } from '@/components/Skeleton';
import { toast } from '@/components/Toast';

import styles from './MonDossierPage.module.scss';

// Libellés français pour les clés i18n de document_type_key servies par l'API.
// V1 statique côté front ; à terme servi par /api/config si on veut le rendre admin-editable.
const DOC_TYPE_LABELS: Record<string, string> = {
	insurance_certificate: 'Attestation d\'assurance habitation',
	identity_document: 'Pièce d\'identité',
	payslip: 'Bulletin de salaire',
	tax_notice: 'Avis d\'imposition',
	employment_proof: 'Contrat de travail / attestation employeur',
	bank_details: 'RIB',
	guarantee_attestation: 'Attestation de garantie (Visale, GLI, etc.)',
	home_ownership_proof: 'Titre de propriété',
};

const STATUS_LABELS: Record<string, string> = {
	validated: '✓ Validé',
	pending_validation: '⏳ En attente de validation',
	rejected: '✗ Rejeté',
};

const STATUS_CLASS: Record<string, string> = {
	validated: styles.statusValidated,
	pending_validation: styles.statusPending,
	rejected: styles.statusRejected,
};

const labelFor = (key: string): string => DOC_TYPE_LABELS[key] ?? key;

const formatBytes = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} o`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
	return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
};

export const MonDossierPage = () => {
	const { data: user } = useAuth();
	const role = user?.role === 'guarantor' ? 'guarantor' : 'tenant';

	const leasesQ = useMyLeases();
	const docTypesQ = useDocumentTypes(role);
	const docsQ = useDocuments();
	const uploadMut = useUploadDocument();
	const shareMut = useCreateDocumentShare();

	const [shareUrl, setShareUrl] = useState<string | null>(null);

	if (leasesQ.isLoading || docTypesQ.isLoading || docsQ.isLoading) {
		return (
			<div className={styles.wrap}>
				<Skeleton lines={8} />
			</div>
		);
	}

	const leases = leasesQ.data ?? [];
	const documents = docsQ.data ?? [];

	// La whitelist /api/document-types?role=X renvoie { role, types: [...] }
	const allowedTypes =
		docTypesQ.data && 'types' in docTypesQ.data ? docTypesQ.data.types : [];

	const handleUpload = (leaseId: string, documentTypeKey: string) => (files: File[]) => {
		for (const file of files) {
			uploadMut.mutate(
				{ file, leaseId, documentTypeKey },
				{ onSuccess: () => toast.success(`${labelFor(documentTypeKey)} envoyé`) },
			);
		}
	};

	const handleShare = (documentId: string) => {
		shareMut.mutate(
			{ documentId },
			{
				onSuccess: (data) => {
					setShareUrl(data.shareUrl);
					toast.success('Lien de partage créé (valide 7 jours)');
				},
			},
		);
	};

	const handleCopyShareLink = async () => {
		if (!shareUrl) return;
		await navigator.clipboard.writeText(shareUrl);
		toast.success('Lien copié ✓');
	};

	if (leases.length === 0) {
		return (
			<div className={styles.wrap}>
				<h1 className={styles.title}>Mon dossier</h1>
				<div className={styles.empty}>
					<p>Aucun bail associé à ton compte pour l'instant.</p>
					<p className={styles.muted}>
						Si tu viens d'accepter une invitation, demande à ton bailleur de te rattacher à un bail
						existant.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.wrap}>
			<h1 className={styles.title}>Mon dossier</h1>
			<p className={styles.subtitle}>
				Déposez les documents demandés par votre bailleur. Glissez vos fichiers dans chaque carte ou
				cliquez pour parcourir.
			</p>

			{leases.map((lease) => {
				const leaseDocs = documents.filter((d) => d.leaseId === lease.id);
				return (
					<section className={styles.leaseSection} key={lease.id}>
						<header className={styles.leaseHeader}>
							<h2>Bail #{lease.id.slice(0, 8)}</h2>
							<p className={styles.muted}>
								{lease.leaseTypeKey === 'empty' ? 'Vide' : 'Meublé'} · Loyer{' '}
								{(lease.monthlyRentCents / 100).toFixed(2)} € · Échéance le {lease.paymentDay} du
								mois
							</p>
						</header>

						<div className={styles.grid}>
							{allowedTypes.map((typeKey) => {
								const docsForType = leaseDocs.filter((d) => d.documentTypeKey === typeKey);
								return (
									<div className={styles.card} key={typeKey}>
										<h3 className={styles.cardTitle}>{labelFor(typeKey)}</h3>

										{docsForType.length > 0 ? (
											<ul className={styles.docList}>
												{docsForType.map((doc: DocumentItem) => (
													<li className={styles.docItem} key={doc.id}>
														<div className={styles.docMeta}>
															<a
																className={styles.docLink}
																href={getDocumentDownloadUrl(doc.id)}
																rel="noopener noreferrer"
																target="_blank"
															>
																{doc.originalFilename}
															</a>
															<span className={styles.docSize}>
																{formatBytes(doc.fileSizeBytes)}
															</span>
														</div>
														<div className={styles.docActions}>
															<span
																className={`${styles.status} ${STATUS_CLASS[doc.statusKey] ?? ''}`}
															>
																{STATUS_LABELS[doc.statusKey] ?? doc.statusKey}
															</span>
															<Button
																isDisabled={shareMut.isPending}
																onPress={() => handleShare(doc.id)}
																variant="ghost"
															>
																Partager
															</Button>
														</div>
														{doc.rejectionReason ? (
															<p className={styles.rejectionReason}>
																Motif du rejet : {doc.rejectionReason}
															</p>
														) : null}
													</li>
												))}
											</ul>
										) : (
											<p className={styles.cardEmpty}>Aucun document fourni.</p>
										)}

										<FileUpload
											acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
											description="Glissez vos fichiers ici ou cliquez pour parcourir"
											label="Ajouter"
											maxFileSize={20 * 1024 * 1024}
											multiple
											onError={(errors) =>
												errors.forEach((e) => toast.error(e.message))
											}
											onFilesAdded={handleUpload(lease.id, typeKey)}
										/>
									</div>
								);
							})}
						</div>
					</section>
				);
			})}

			<Modal
				isOpen={shareUrl !== null}
				onOpenChange={(open) => !open && setShareUrl(null)}
				size="md"
				title="Lien de partage généré"
			>
				<p>Ce lien est valide pendant 7 jours et permet au destinataire de télécharger le document sans avoir besoin d'un compte.</p>
				<div className={styles.shareBlock}>
					<code className={styles.shareUrl}>{shareUrl}</code>
				</div>
				<div className={styles.shareActions}>
					<Button onPress={handleCopyShareLink}>Copier le lien</Button>
					<Button onPress={() => setShareUrl(null)} variant="ghost">
						Fermer
					</Button>
				</div>
			</Modal>
		</div>
	);
};
