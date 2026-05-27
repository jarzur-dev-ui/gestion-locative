import { useState } from 'react';

import { Button } from '@/components/Button/Button';
import { TextField } from '@/components/TextField/TextField';
import { useData } from '@/contexts/DataContext';
import { QuittanceDocument } from '@/documents/QuittanceDocument/QuittanceDocument';
import { todayIso } from '@/utils/format';
import { buildQuittance } from '@/utils/quittance';

import styles from './QuittancesPage.module.scss';

interface BailOptions {
	soldeAnterieur: number;
	teom: number;
	regulCharges: number;
}

const EMPTY: BailOptions = { soldeAnterieur: 0, teom: 0, regulCharges: 0 };

export const QuittancesPage = () => {
	const { baux, bailleur } = useData();
	const now = new Date();

	const [year, setYear] = useState(now.getFullYear());
	const [month, setMonth] = useState(now.getMonth() + 1);
	const [dateEmission, setDateEmission] = useState(todayIso());
	const [options, setOptions] = useState<Record<string, BailOptions>>({});
	const [generated, setGenerated] = useState(false);

	const num = (value: string): number => parseFloat(value) || 0;
	const optionsFor = (id: string): BailOptions => options[id] ?? EMPTY;
	const setOption = (id: string, patch: Partial<BailOptions>): void => {
		setOptions((prev) => ({ ...prev, [id]: { ...optionsFor(id), ...patch } }));
		setGenerated(false);
	};

	return (
		<div className={styles.page}>
			<div className="no-print">
				<h1>Quittances du mois</h1>

				<section className={styles.controls}>
					<TextField
						label="Année"
						onChange={(e) => {
							setYear(num(e.target.value));
							setGenerated(false);
						}}
						type="number"
						value={year}
					/>
					<TextField
						label="Mois (1-12)"
						max={12}
						min={1}
						onChange={(e) => {
							setMonth(num(e.target.value));
							setGenerated(false);
						}}
						type="number"
						value={month}
					/>
					<TextField
						label="Date d'émission"
						onChange={(e) => setDateEmission(e.target.value)}
						type="date"
						value={dateEmission}
					/>
				</section>

				{baux.length === 0 ? (
					<p className={styles.empty}>
						Aucun bail. Ajoute un bien dans « Biens &amp; baux » d'abord.
					</p>
				) : (
					<section className={styles.optionsList}>
						<h2>Régularisations ponctuelles (optionnel)</h2>
						{baux.map((bail) => (
							<div className={styles.optionRow} key={bail.id}>
								<div className={styles.optionName}>
									{bail.locataire || bail.id}
									<span className={styles.optionType}>{bail.type}</span>
								</div>
								<TextField
									label="Solde antérieur (€)"
									onChange={(e) =>
										setOption(bail.id, { soldeAnterieur: num(e.target.value) })
									}
									type="number"
									value={optionsFor(bail.id).soldeAnterieur}
								/>
								{bail.type === 'logement' ? (
									<>
										<TextField
											label="Régul. charges (€)"
											onChange={(e) =>
												setOption(bail.id, { regulCharges: num(e.target.value) })
											}
											type="number"
											value={optionsFor(bail.id).regulCharges}
										/>
										<TextField
											label="TEOM (€)"
											onChange={(e) =>
												setOption(bail.id, { teom: num(e.target.value) })
											}
											type="number"
											value={optionsFor(bail.id).teom}
										/>
									</>
								) : (
									<span className={styles.na}>
										TEOM / régul. charges : sans objet (parking)
									</span>
								)}
							</div>
						))}
					</section>
				)}

				{baux.length > 0 ? (
					<div className={styles.actions}>
						<Button onClick={() => setGenerated(true)} variant="outlined">
							Générer l'aperçu
						</Button>
						<Button
							disabled={!generated}
							onClick={() => window.print()}
						>
							Imprimer / PDF
						</Button>
					</div>
				) : null}
			</div>

			{generated ? (
				<div className="print-area">
					{baux.map((bail, index) => (
						<QuittanceDocument
							key={bail.id}
							vm={buildQuittance(bail, bailleur, year, month, index, {
								dateEmission,
								...optionsFor(bail.id),
							})}
						/>
					))}
				</div>
			) : null}
		</div>
	);
};
