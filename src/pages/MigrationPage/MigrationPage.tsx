import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
				toast.success('Import terminé');
			},
		});
	};

	const clearLegacyStorage = () => {
		window.localStorage.removeItem('gl.bailleur');
		window.localStorage.removeItem('gl.baux');
		toast.success('LocalStorage legacy supprimé');
		setLegacy(null);
	};

	return (
		<div className={styles.wrap}>
			<header>
				<h1>Importer mes données depuis l'ancienne version</h1>
				<p className={styles.subtitle}>
					Cette page lit les données stockées dans le navigateur par la V1 de gestion-locative
					(clés <code>gl.bailleur</code> et <code>gl.baux</code> du localStorage) et les transfère
					dans la base de données.
				</p>
				<p className={styles.warning}>
					⚠ L'import est idempotent (sûr à re-lancer), mais effectue ces actions :
					<br />
					— Met à jour ton profil bailleur (si déjà rempli, écrasement des valeurs)
					<br />
					— Crée les biens manquants par adresse (skip si déjà créés)
					<br />
					— Crée les locataires manquants par email (skip si déjà existants)
					<br />
					— Crée les baux manquants par (bien + locataire + date début)
				</p>
			</header>

			{legacy === null ? (
				<div className={styles.empty}>
					<p>Aucune donnée legacy détectée dans ce navigateur.</p>
					<p className={styles.muted}>
						Pour importer, ouvre cette page <strong>dans le même navigateur</strong> que celui où
						tu utilisais la V1 de gestion-locative. Les données sont dans le localStorage du
						domaine d'origine — si tu changes de navigateur, elles ne sont pas disponibles.
					</p>
					<Button onPress={() => navigate('/biens')}>Retour</Button>
				</div>
			) : (
				<>
					<section className={styles.preview}>
						<h2>Aperçu des données à importer</h2>
						<dl>
							<dt>Bailleur</dt>
							<dd>
								{legacy.bailleur.nom ?? '(sans nom)'} —{' '}
								{legacy.bailleur.email ?? '(sans email)'}
							</dd>
							<dt>Nombre de baux</dt>
							<dd>{legacy.baux.length}</dd>
							<dt>Locataires (estimation)</dt>
							<dd>
								{
									new Set(
										legacy.baux
											.map((b) => b.locataireEmail ?? b.locataire ?? '')
											.filter(Boolean),
									).size
								}{' '}
								distincts
							</dd>
						</dl>
					</section>

					{report === null ? (
						<div className={styles.actions}>
							<Button isDisabled={importMut.isPending} onPress={doImport}>
								{importMut.isPending ? 'Import en cours…' : `Lancer l'import (${legacy.baux.length} baux)`}
							</Button>
							<Button onPress={() => navigate('/biens')} variant="ghost">
								Annuler
							</Button>
						</div>
					) : (
						<section className={styles.report}>
							<h2>Résultat de l'import</h2>
							<dl>
								<dt>Profil bailleur</dt>
								<dd>
									{report.profile.created
										? '✓ Créé'
										: report.profile.updated
											? '✓ Mis à jour'
											: '— inchangé'}
								</dd>
								<dt>Biens</dt>
								<dd>
									{report.properties.created} créés, {report.properties.skipped} déjà présents
								</dd>
								<dt>Locataires</dt>
								<dd>
									{report.tenants.created} créés, {report.tenants.skipped} déjà présents
								</dd>
								<dt>Garants</dt>
								<dd>
									{report.guarantors.created} créés, {report.guarantors.skipped} déjà présents
								</dd>
								<dt>Baux</dt>
								<dd>
									{report.leases.created} créés, {report.leases.skipped} déjà présents
								</dd>
							</dl>

							{report.warnings.length > 0 ? (
								<>
									<h3>Avertissements ({report.warnings.length})</h3>
									<ul>
										{report.warnings.map((w, i) => (
											<li key={i}>{w}</li>
										))}
									</ul>
								</>
							) : null}

							<div className={styles.actions}>
								<Button onPress={() => navigate('/biens')}>Voir mes biens</Button>
								<Button onPress={() => setConfirmOpen(true)} variant="danger">
									Vider le localStorage legacy
								</Button>
							</div>
						</section>
					)}
				</>
			)}

			<ConfirmDialog
				description="Une fois supprimées, les données legacy du localStorage seront perdues. Confirme uniquement si l'import s'est bien passé et que tu n'auras plus besoin de relancer cet écran."
				isOpen={confirmOpen}
				onConfirm={clearLegacyStorage}
				onOpenChange={setConfirmOpen}
				title="Vider le localStorage legacy ?"
				variant="danger"
			/>
		</div>
	);
};
