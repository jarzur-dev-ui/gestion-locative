import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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

// Mappe la clé document_type_key servie par l'API vers la clé i18n camelCase.
const DOC_TYPE_I18N_KEYS: Record<string, string> = {
	insurance_certificate: 'insuranceCertificate',
	identity_document: 'identityDocument',
	payslip: 'payslip',
	tax_notice: 'taxNotice',
	employment_proof: 'employmentProof',
	bank_details: 'bankDetails',
	guarantee_attestation: 'guaranteeAttestation',
	home_ownership_proof: 'homeOwnershipProof',
};

const STATUS_I18N_KEYS: Record<string, string> = {
	validated: 'validated',
	pending_validation: 'pendingValidation',
	rejected: 'rejected',
};

const STATUS_CLASS: Record<string, string> = {
	validated: styles.statusValidated,
	pending_validation: styles.statusPending,
	rejected: styles.statusRejected,
};

const labelFor = (key: string, t: TFunction): string => {
	const i18nKey = DOC_TYPE_I18N_KEYS[key];
	return i18nKey ? t(`myFile.docTypeLabels.${i18nKey}` as never) : key;
};

const statusLabelFor = (key: string, t: TFunction): string => {
	const i18nKey = STATUS_I18N_KEYS[key];
	return i18nKey ? t(`myFile.docStatus.${i18nKey}` as never) : key;
};

const formatBytes = (bytes: number, t: TFunction): string => {
	if (bytes < 1024) return t('myFile.fileSize.bytes', { value: bytes });
	if (bytes < 1024 * 1024) {
		return t('myFile.fileSize.kilobytes', { value: (bytes / 1024).toFixed(0) });
	}
	return t('myFile.fileSize.megabytes', { value: (bytes / 1024 / 1024).toFixed(1) });
};

export const MonDossierPage = () => {
	const { t } = useTranslation();
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
				{
					onSuccess: () =>
						toast.success(
							t('myFile.toast.uploaded', { docType: labelFor(documentTypeKey, t) }),
						),
				},
			);
		}
	};

	const handleShare = (documentId: string) => {
		shareMut.mutate(
			{ documentId },
			{
				onSuccess: (data) => {
					setShareUrl(data.shareUrl);
					toast.success(t('myFile.toast.shareCreated'));
				},
			},
		);
	};

	const handleCopyShareLink = async () => {
		if (!shareUrl) return;
		await navigator.clipboard.writeText(shareUrl);
		toast.success(t('myFile.toast.linkCopied'));
	};

	if (leases.length === 0) {
		return (
			<div className={styles.wrap}>
				<h1 className={styles.title}>{t('myFile.title')}</h1>
				<div className={styles.empty}>
					<p>{t('myFile.empty.title')}</p>
					<p className={styles.muted}>{t('myFile.empty.hint')}</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.wrap}>
			<h1 className={styles.title}>{t('myFile.title')}</h1>
			<p className={styles.subtitle}>{t('myFile.subtitle')}</p>

			{leases.map((lease) => {
				const leaseDocs = documents.filter((d) => d.leaseId === lease.id);
				return (
					<section className={styles.leaseSection} key={lease.id}>
						<header className={styles.leaseHeader}>
							<h2>{t('myFile.lease.heading', { id: lease.id.slice(0, 8) })}</h2>
							<p className={styles.muted}>
								{t('myFile.lease.summary', {
									type:
										lease.leaseTypeKey === 'empty'
											? t('myFile.lease.typeEmpty')
											: t('myFile.lease.typeFurnished'),
									rent: (lease.monthlyRentCents / 100).toFixed(2),
									day: lease.paymentDay,
								})}
							</p>
						</header>

						<div className={styles.grid}>
							{allowedTypes.map((typeKey) => {
								const docsForType = leaseDocs.filter((d) => d.documentTypeKey === typeKey);
								return (
									<div className={styles.card} key={typeKey}>
										<h3 className={styles.cardTitle}>{labelFor(typeKey, t)}</h3>

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
																{formatBytes(doc.fileSizeBytes, t)}
															</span>
														</div>
														<div className={styles.docActions}>
															<span
																className={`${styles.status} ${STATUS_CLASS[doc.statusKey] ?? ''}`}
															>
																{statusLabelFor(doc.statusKey, t)}
															</span>
															<Button
																isDisabled={shareMut.isPending}
																onPress={() => handleShare(doc.id)}
																variant="ghost"
															>
																{t('myFile.share')}
															</Button>
														</div>
														{doc.rejectionReason ? (
															<p className={styles.rejectionReason}>
																{t('myFile.rejectionReason', {
																	reason: doc.rejectionReason,
																})}
															</p>
														) : null}
													</li>
												))}
											</ul>
										) : (
											<p className={styles.cardEmpty}>{t('myFile.card.empty')}</p>
										)}

										<FileUpload
											acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
											description={t('myFile.upload.description')}
											label={t('common.actions.add')}
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
				title={t('myFile.shareModal.title')}
			>
				<p>{t('myFile.shareModal.description')}</p>
				<div className={styles.shareBlock}>
					<code className={styles.shareUrl}>{shareUrl}</code>
				</div>
				<div className={styles.shareActions}>
					<Button onPress={handleCopyShareLink}>{t('myFile.shareModal.copyButton')}</Button>
					<Button onPress={() => setShareUrl(null)} variant="ghost">
						{t('common.actions.close')}
					</Button>
				</div>
			</Modal>
		</div>
	);
};
