import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/config/routes';

import {
	type ImportReport,
	type ImportRequest,
	readLegacyLocalStorage,
	useImportLegacy,
} from '@/api/migration';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/Modal';
import { toast } from '@/components/Toast';

import styles from './MigrationPage.module.scss';

export const MigrationPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const importMut = useImportLegacy();

	// Lecture unique du localStorage legacy à l'initialisation (système externe) :
	// un initialiseur paresseux de useState suffit, pas besoin d'un effet.
	const [legacy, setLegacy] = useState<ImportRequest | null>(() => readLegacyLocalStorage());
	const [report, setReport] = useState<ImportReport | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);

	const doImport = () => {
		if (!legacy) return;
		importMut.mutate(legacy, {
			onSuccess: (rep) => {
				setReport(rep);
				toast.success(t('migration.toast.importDone'));
			},
		});
	};

	const clearLegacyStorage = () => {
		window.localStorage.removeItem('gl.bailleur');
		window.localStorage.removeItem('gl.baux');
		toast.success(t('migration.toast.storageCleared'));
		setLegacy(null);
	};

	return (
		<div className={styles.wrap}>
			<header>
				<h1>{t('migration.title')}</h1>
				<p className={styles.subtitle}>
					{t('migration.subtitlePart1')}
					<code>gl.bailleur</code>
					{t('migration.subtitlePart2')}
					<code>gl.baux</code>
					{t('migration.subtitlePart3')}
				</p>
				<p className={styles.warning}>
					{t('migration.warningIntro')}
					<br />
					{t('migration.warningBullet1')}
					<br />
					{t('migration.warningBullet2')}
					<br />
					{t('migration.warningBullet3')}
					<br />
					{t('migration.warningBullet4')}
				</p>
			</header>

			{legacy === null ? (
				<div className={styles.empty}>
					<p>{t('migration.empty.title')}</p>
					<p className={styles.muted}>
						{t('migration.empty.hintPart1')}
						<strong>{t('migration.empty.hintStrong')}</strong>
						{t('migration.empty.hintPart2')}
					</p>
					<Button onPress={() => navigate(paths.biens())}>{t('migration.back')}</Button>
				</div>
			) : (
				<>
					<section className={styles.preview}>
						<h2>{t('migration.preview.title')}</h2>
						<dl>
							<dt>{t('migration.preview.bailleur')}</dt>
							<dd>
								{legacy.bailleur.nom ?? t('migration.preview.noName')} —{' '}
								{legacy.bailleur.email ?? t('migration.preview.noEmail')}
							</dd>
							<dt>{t('migration.preview.leaseCount')}</dt>
							<dd>{legacy.baux.length}</dd>
							<dt>{t('migration.preview.tenantsEstimate')}</dt>
							<dd>
								{t('migration.preview.distinctCount', {
									count: new Set(
										legacy.baux
											.map((b) => b.locataireEmail ?? b.locataire ?? '')
											.filter(Boolean),
									).size,
								})}
							</dd>
						</dl>
					</section>

					{report === null ? (
						<div className={styles.actions}>
							<Button isDisabled={importMut.isPending} onPress={doImport}>
								{importMut.isPending
									? t('migration.importing')
									: t('migration.startImport', { count: legacy.baux.length })}
							</Button>
							<Button onPress={() => navigate(paths.biens())} variant="ghost">
								{t('common.actions.cancel')}
							</Button>
						</div>
					) : (
						<section className={styles.report}>
							<h2>{t('migration.report.title')}</h2>
							<dl>
								<dt>{t('migration.report.profile')}</dt>
								<dd>
									{report.profile.created
										? t('migration.report.created')
										: report.profile.updated
											? t('migration.report.updated')
											: t('migration.report.unchanged')}
								</dd>
								<dt>{t('migration.report.properties')}</dt>
								<dd>
									{t('migration.report.createdSkipped', {
										created: report.properties.created,
										skipped: report.properties.skipped,
									})}
								</dd>
								<dt>{t('migration.report.tenants')}</dt>
								<dd>
									{t('migration.report.createdSkipped', {
										created: report.tenants.created,
										skipped: report.tenants.skipped,
									})}
								</dd>
								<dt>{t('migration.report.guarantors')}</dt>
								<dd>
									{t('migration.report.createdSkipped', {
										created: report.guarantors.created,
										skipped: report.guarantors.skipped,
									})}
								</dd>
								<dt>{t('migration.report.leases')}</dt>
								<dd>
									{t('migration.report.createdSkipped', {
										created: report.leases.created,
										skipped: report.leases.skipped,
									})}
								</dd>
							</dl>

							{report.warnings.length > 0 ? (
								<>
									<h3>
										{t('migration.report.warningsTitle', { count: report.warnings.length })}
									</h3>
									<ul>
										{report.warnings.map((w, i) => (
											<li key={i}>{w}</li>
										))}
									</ul>
								</>
							) : null}

							<div className={styles.actions}>
								<Button onPress={() => navigate(paths.biens())}>{t('migration.viewProperties')}</Button>
								<Button onPress={() => setConfirmOpen(true)} variant="danger">
									{t('migration.clearStorage')}
								</Button>
							</div>
						</section>
					)}
				</>
			)}

			<ConfirmDialog
				description={t('migration.confirmClear.description')}
				isOpen={confirmOpen}
				onConfirm={clearLegacyStorage}
				onOpenChange={setConfirmOpen}
				title={t('migration.confirmClear.title')}
				variant="danger"
			/>
		</div>
	);
};
