import classNames from 'classnames';
import { useEffect, useMemo, useState } from 'react';

import { useLeases } from '@/api/leases';
import { type Property, useProperties } from '@/api/properties';
import {
	type Adjustment,
	type AdjustmentType,
	type RentPeriod,
	useMarkPaid,
	useMarkUnpaid,
	usePatchRentPeriod,
	useRentPeriods,
	useSendNotice,
} from '@/api/rent-periods';
import { Button } from '@/components/Button';
import { ConfirmDialog, Modal } from '@/components/Modal';
import { SelectField } from '@/components/SelectField';
import { Skeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { toast } from '@/components/Toast';

import styles from './QuittancesPage.module.scss';

// ─── Helpers de formatage français ───────────────────────────────────────────

const CURRENCY_FORMATTER = new Intl.NumberFormat('fr-FR', {
	style: 'currency',
	currency: 'EUR',
});

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
	month: 'long',
	year: 'numeric',
});

const formatCents = (cents: number): string => CURRENCY_FORMATTER.format(cents / 100);

const formatPeriodMonth = (periodMonth: string): string => {
	// periodMonth est au format "YYYY-MM" (ou ISO date avec un jour quelconque).
	const [year, month] = periodMonth.split('-');
	if (!year || !month) return periodMonth;
	const date = new Date(Number(year), Number(month) - 1, 1);
	const label = MONTH_LABEL_FORMATTER.format(date);
	return label.charAt(0).toUpperCase() + label.slice(1);
};

const formatDateFr = (iso: string | null | undefined): string => {
	if (!iso) return '';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	return `${day}/${month}/${date.getFullYear()}`;
};

// ─── Liste des mois proposés dans le sélecteur ───────────────────────────────
// 6 mois en arrière + mois courant + 6 mois en avant. Suffisant pour
// retrouver une période passée ou anticiper le mois prochain.

interface MonthOption {
	value: string; // "YYYY-MM"
	label: string;
}

const buildMonthOptions = (): MonthOption[] => {
	const now = new Date();
	const options: MonthOption[] = [];
	for (let offset = -6; offset <= 6; offset++) {
		const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
		const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		options.push({ value, label: formatPeriodMonth(value) });
	}
	return options;
};

const defaultPeriodMonth = (): string => {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const STATUS_LABELS: Record<RentPeriod['statusKey'], string> = {
	draft: 'Brouillon',
	notice_sent: 'Avis envoyé',
	paid: 'Payé',
};

const UNPAID_WINDOW_MS = 24 * 60 * 60 * 1000;

// Fenêtre d'annulation 24h : le back ne fournit pas de flag dédié, on compare
// donc `paidAt` à l'instant courant. La comparaison reste un helper pur (on lui
// injecte `now`) ; l'horloge est lue dans un effet, jamais pendant le rendu.
const isWithinUndoWindow = (
	statusKey: RentPeriod['statusKey'],
	paidAt: string | null | undefined,
	now: number,
): boolean => {
	if (statusKey !== 'paid' || !paidAt) return false;
	const paidAtMs = new Date(paidAt).getTime();
	if (Number.isNaN(paidAtMs)) return false;
	return now - paidAtMs <= UNPAID_WINDOW_MS;
};

// ─── Page ────────────────────────────────────────────────────────────────────

export const QuittancesPage = () => {
	const monthOptions = useMemo(() => buildMonthOptions(), []);
	const [periodMonth, setPeriodMonth] = useState<string>(defaultPeriodMonth());

	const { data: rentPeriods, isLoading } = useRentPeriods({ periodMonth });

	// Évite le N+1 : au lieu que chaque carte appelle useLease + useProperty
	// (jusqu'à 2N requêtes), on récupère les listes complètes une fois (2 requêtes)
	// et on les indexe par id pour les distribuer aux cartes.
	const { data: leases } = useLeases();
	const { data: properties } = useProperties();

	const leaseById = useMemo(
		() => new Map((leases ?? []).map((l) => [l.id, l])),
		[leases],
	);
	const propertyById = useMemo(
		() => new Map((properties ?? []).map((p) => [p.id, p])),
		[properties],
	);

	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<h1>Quittances</h1>
				<div className={styles.headerControl}>
					<label className={styles.headerLabel} htmlFor="period-month">
						Mois affiché
					</label>
					<select
						className={styles.headerSelect}
						id="period-month"
						onChange={(e) => setPeriodMonth(e.target.value)}
						value={periodMonth}
					>
						{monthOptions.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</div>
			</header>

			{isLoading ? (
				<Skeleton lines={6} />
			) : !rentPeriods || rentPeriods.length === 0 ? (
				<p className={styles.empty}>
					Aucune quittance pour ce mois. Si tu as des baux actifs, elles seront créées
					automatiquement par le scheduler 15 jours avant le jour d'échéance.
				</p>
			) : (
				<ul className={styles.cardList}>
					{rentPeriods.map((rp) => {
						const lease = leaseById.get(rp.leaseId);
						const property = lease ? propertyById.get(lease.propertyId) : undefined;
						return (
							<RentPeriodCard key={rp.id} property={property} rentPeriod={rp} />
						);
					})}
				</ul>
			)}
		</div>
	);
};

// ─── Carte d'une période ─────────────────────────────────────────────────────

interface RentPeriodCardProps {
	rentPeriod: RentPeriod;
	/**
	 * Bien résolu côté liste (via le bail) — évite un useLease + useProperty par
	 * carte, donc le N+1 (jusqu'à 2N requêtes).
	 */
	property: Property | undefined;
}

const RentPeriodCard = ({ rentPeriod, property }: RentPeriodCardProps) => {
	const markPaid = useMarkPaid();
	const markUnpaid = useMarkUnpaid();
	const sendNotice = useSendNotice();

	const [confirmUnpaidOpen, setConfirmUnpaidOpen] = useState(false);
	const [adjustModalOpen, setAdjustModalOpen] = useState(false);

	const isPaid = rentPeriod.statusKey === 'paid';
	const isDraft = rentPeriod.statusKey === 'draft';
	const totalAdjustments = rentPeriod.adjustments.reduce((sum, a) => sum + a.amountCents, 0);

	// Fenêtre d'annulation 24h : on vérifie côté front pour éviter un round-trip.
	// L'horloge est lue à l'init (lazy) puis rafraîchie par un intervalle — jamais
	// pendant le rendu (pureté des composants). `now` n'avance que par tick, donc
	// la valeur dérivée plus bas reste stable entre deux ticks.
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		// Re-vérifie chaque minute pour faire disparaître l'action à l'expiration.
		const interval = window.setInterval(() => setNow(Date.now()), 60_000);
		return () => window.clearInterval(interval);
	}, []);
	const canUndoUnpaid = isWithinUndoWindow(rentPeriod.statusKey, rentPeriod.paidAt, now);

	const tenantNames = rentPeriod.tenants
		.map((t) => `${t.firstName} ${t.lastName}`)
		.join(' & ');
	const propertyAddress = property
		? `${property.addressLine}, ${property.postalCode} ${property.city}`
		: null;

	// Action : marquer payé (optimistic update dans le hook).
	const handleMarkPaid = (): void => {
		markPaid.mutate(rentPeriod.id, {
			onSuccess: () => {
				toast.success('Paiement enregistré, quittance générée');
			},
		});
	};

	// Action : tentative d'annulation depuis "Non".
	const handleRequestUnpaid = (): void => {
		if (!canUndoUnpaid) {
			toast.error("Fenêtre d'annulation dépassée (24h)");
			return;
		}
		setConfirmUnpaidOpen(true);
	};

	const handleConfirmUnpaid = async (): Promise<void> => {
		await markUnpaid.mutateAsync(rentPeriod.id);
		toast.success('Paiement annulé');
	};

	const handleSendNotice = (): void => {
		sendNotice.mutate(rentPeriod.id, {
			onSuccess: () => {
				toast.success("Avis d'échéance envoyé");
			},
		});
	};

	return (
		<li className={styles.card}>
			<div className={styles.cardHeader}>
				<div>
					<div className={styles.cardTitle}>
						{tenantNames || 'Bail'}
					</div>
					{propertyAddress ? (
						<div className={styles.cardSubtitle}>{propertyAddress}</div>
					) : null}
				</div>
				<span className={classNames(styles.statusBadge, styles[`status_${rentPeriod.statusKey}`])}>
					{STATUS_LABELS[rentPeriod.statusKey]}
				</span>
			</div>

			<dl className={styles.cardFacts}>
				<div className={styles.fact}>
					<dt>Période</dt>
					<dd>{formatPeriodMonth(rentPeriod.periodMonth)}</dd>
				</div>
				<div className={styles.fact}>
					<dt>Échéance</dt>
					<dd>{formatDateFr(rentPeriod.dueDate)}</dd>
				</div>
				<div className={styles.fact}>
					<dt>Loyer</dt>
					<dd>{formatCents(rentPeriod.baseRentCents)}</dd>
				</div>
				<div className={styles.fact}>
					<dt>Charges</dt>
					<dd>{formatCents(rentPeriod.baseChargesCents)}</dd>
				</div>
				{rentPeriod.adjustments.length > 0 ? (
					<div className={styles.fact}>
						<dt>Régularisations</dt>
						<dd>{formatCents(totalAdjustments)}</dd>
					</div>
				) : null}
				<div className={classNames(styles.fact, styles.factTotal)}>
					<dt>Total dû</dt>
					<dd>{formatCents(rentPeriod.totalDueCents)}</dd>
				</div>
			</dl>

			{rentPeriod.adjustments.length > 0 ? (
				<ul className={styles.adjustmentList}>
					{rentPeriod.adjustments.map((adj, i) => (
						<li className={styles.adjustment} key={`${adj.type}-${i}`}>
							<span>{adj.label || ADJUSTMENT_TYPE_LABELS[adj.type]}</span>
							<span>{formatCents(adj.amountCents)}</span>
						</li>
					))}
				</ul>
			) : null}

			{rentPeriod.noticeSentAt ? (
				<p className={styles.cardNote}>
					Avis envoyé le {formatDateFr(rentPeriod.noticeSentAt)}
				</p>
			) : null}

			{/* Toggle Oui/Non : feature centrale */}
			<div className={styles.toggleRow}>
				<span className={styles.toggleLabel}>Paiement reçu ?</span>
				<div
					aria-label="Paiement reçu"
					className={styles.toggle}
					role="group"
				>
					<button
						aria-pressed={isPaid}
						className={classNames(styles.toggleBtn, isPaid && styles.toggleBtnActive)}
						disabled={isPaid || markPaid.isPending}
						onClick={handleMarkPaid}
						type="button"
					>
						Oui
					</button>
					<button
						aria-pressed={!isPaid}
						className={classNames(styles.toggleBtn, !isPaid && styles.toggleBtnActive)}
						disabled={!isPaid || markUnpaid.isPending}
						onClick={handleRequestUnpaid}
						type="button"
					>
						Non
					</button>
				</div>
			</div>

			{isPaid && rentPeriod.paidAt ? (
				<p className={styles.cardNote}>
					Quittance générée le {formatDateFr(rentPeriod.paidAt)}
				</p>
			) : null}

			{/* Bouton "Annuler" rouge dans la fenêtre 24h */}
			{isPaid && canUndoUnpaid ? (
				<div className={styles.cardActions}>
					<Button
						isDisabled={markUnpaid.isPending}
						onPress={handleRequestUnpaid}
						variant="danger"
					>
						↩ Annuler le paiement
					</Button>
				</div>
			) : null}

			{/* Actions disponibles en draft : régularisations + envoyer l'avis */}
			{isDraft ? (
				<div className={styles.cardActions}>
					<Button
						isDisabled={sendNotice.isPending}
						onPress={handleSendNotice}
						variant="outlined"
					>
						Envoyer l'avis maintenant
					</Button>
					<Button onPress={() => setAdjustModalOpen(true)} variant="outlined">
						Ajouter une régularisation
					</Button>
				</div>
			) : null}

			<ConfirmDialog
				description="La quittance sera marquée comme annulée."
				isOpen={confirmUnpaidOpen}
				isPending={markUnpaid.isPending}
				onConfirm={handleConfirmUnpaid}
				onOpenChange={setConfirmUnpaidOpen}
				title="Annuler le paiement ?"
				variant="danger"
			/>

			<AddAdjustmentModal
				isOpen={adjustModalOpen}
				onOpenChange={setAdjustModalOpen}
				rentPeriod={rentPeriod}
			/>
		</li>
	);
};

// ─── Modal d'ajout d'une régularisation ──────────────────────────────────────

const ADJUSTMENT_TYPES: AdjustmentType[] = [
	'teom',
	'previous_balance',
	'charges_regularization',
	'other',
];

const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
	teom: 'TEOM',
	previous_balance: 'Solde antérieur',
	charges_regularization: 'Régularisation de charges',
	other: 'Autre',
};

interface AddAdjustmentModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	rentPeriod: RentPeriod;
}

const AddAdjustmentModal = ({
	isOpen,
	onOpenChange,
	rentPeriod,
}: AddAdjustmentModalProps) => {
	const [type, setType] = useState<AdjustmentType>('teom');
	const [label, setLabel] = useState('');
	const [amountCents, setAmountCents] = useState<number>(0);
	const patch = usePatchRentPeriod();

	// Reset à chaque ouverture (sinon les valeurs de la précédente fuient).
	const handleOpenChange = (open: boolean): void => {
		if (open) {
			setType('teom');
			setLabel('');
			setAmountCents(0);
		}
		onOpenChange(open);
	};

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();
		const newAdjustment: Adjustment = {
			type,
			label: label.trim() || undefined,
			amountCents,
		};
		try {
			await patch.mutateAsync({
				id: rentPeriod.id,
				body: { adjustments: [...rentPeriod.adjustments, newAdjustment] },
			});
		} catch {
			// Le toast d'erreur est déjà affiché par le mutationCache global ;
			// on intercepte juste le rejet pour ne pas exécuter les effets de
			// succès (toast + fermeture) et éviter une promesse non gérée.
			return;
		}
		toast.success('Régularisation ajoutée');
		onOpenChange(false);
	};

	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			size="sm"
			title="Ajouter une régularisation"
		>
			<form className={styles.adjustmentForm} onSubmit={handleSubmit}>
				<SelectField
					label="Type"
					onChange={(e) => setType(e.target.value as AdjustmentType)}
					options={ADJUSTMENT_TYPES}
					value={type}
				/>
				<TextField
					label="Libellé (optionnel)"
					onChange={(e) => setLabel(e.target.value)}
					placeholder={ADJUSTMENT_TYPE_LABELS[type]}
					type="text"
					value={label}
				/>
				<TextField
					hint="Montant en centimes (ex: 1234 = 12,34 €)"
					label="Montant (centimes)"
					onChange={(e) => setAmountCents(Number(e.target.value) || 0)}
					step={1}
					type="number"
					value={amountCents}
				/>
				<div className={styles.adjustmentFormActions}>
					<Button
						isDisabled={patch.isPending}
						onPress={() => onOpenChange(false)}
						variant="outlined"
					>
						Annuler
					</Button>
					<Button isDisabled={patch.isPending} type="submit">
						{patch.isPending ? '…en cours' : 'Ajouter'}
					</Button>
				</div>
			</form>
		</Modal>
	);
};
