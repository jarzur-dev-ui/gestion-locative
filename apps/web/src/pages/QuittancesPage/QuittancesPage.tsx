import classNames from 'classnames';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

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

const STATUS_I18N_KEY: Record<RentPeriod['statusKey'], string> = {
	draft: 'draft',
	notice_sent: 'noticeSent',
	paid: 'paid',
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
	const { t } = useTranslation();
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
				<h1>{t('rentReceipts.title')}</h1>
				<div className={styles.headerControl}>
					<label className={styles.headerLabel} htmlFor="period-month">
						{t('rentReceipts.monthLabel')}
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
				<p className={styles.empty}>{t('rentReceipts.empty')}</p>
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
	const { t } = useTranslation();
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
		.map((tenant) => `${tenant.firstName} ${tenant.lastName}`)
		.join(' & ');
	const propertyAddress = property
		? `${property.addressLine}, ${property.postalCode} ${property.city}`
		: null;

	// Action : marquer payé (optimistic update dans le hook).
	const handleMarkPaid = (): void => {
		markPaid.mutate(rentPeriod.id, {
			onSuccess: () => {
				toast.success(t('rentReceipts.toast.paidSuccess'));
			},
		});
	};

	// Action : tentative d'annulation depuis "Non".
	const handleRequestUnpaid = (): void => {
		if (!canUndoUnpaid) {
			toast.error(t('rentReceipts.toast.undoWindowExpired'));
			return;
		}
		setConfirmUnpaidOpen(true);
	};

	const handleConfirmUnpaid = async (): Promise<void> => {
		await markUnpaid.mutateAsync(rentPeriod.id);
		toast.success(t('rentReceipts.toast.unpaidSuccess'));
	};

	const handleSendNotice = (): void => {
		sendNotice.mutate(rentPeriod.id, {
			onSuccess: () => {
				toast.success(t('rentReceipts.toast.noticeSentSuccess'));
			},
		});
	};

	return (
		<li className={styles.card}>
			<div className={styles.cardHeader}>
				<div>
					<div className={styles.cardTitle}>
						{tenantNames || t('rentReceipts.card.defaultTitle')}
					</div>
					{propertyAddress ? (
						<div className={styles.cardSubtitle}>{propertyAddress}</div>
					) : null}
				</div>
				<span className={classNames(styles.statusBadge, styles[`status_${rentPeriod.statusKey}`])}>
					{t(`rentReceipts.status.${STATUS_I18N_KEY[rentPeriod.statusKey]}` as never)}
				</span>
			</div>

			<dl className={styles.cardFacts}>
				<div className={styles.fact}>
					<dt>{t('rentReceipts.card.facts.period')}</dt>
					<dd>{formatPeriodMonth(rentPeriod.periodMonth)}</dd>
				</div>
				<div className={styles.fact}>
					<dt>{t('rentReceipts.card.facts.dueDate')}</dt>
					<dd>{formatDateFr(rentPeriod.dueDate)}</dd>
				</div>
				<div className={styles.fact}>
					<dt>{t('rentReceipts.card.facts.rent')}</dt>
					<dd>{formatCents(rentPeriod.baseRentCents)}</dd>
				</div>
				<div className={styles.fact}>
					<dt>{t('rentReceipts.card.facts.charges')}</dt>
					<dd>{formatCents(rentPeriod.baseChargesCents)}</dd>
				</div>
				{rentPeriod.adjustments.length > 0 ? (
					<div className={styles.fact}>
						<dt>{t('rentReceipts.card.facts.adjustments')}</dt>
						<dd>{formatCents(totalAdjustments)}</dd>
					</div>
				) : null}
				<div className={classNames(styles.fact, styles.factTotal)}>
					<dt>{t('rentReceipts.card.facts.totalDue')}</dt>
					<dd>{formatCents(rentPeriod.totalDueCents)}</dd>
				</div>
			</dl>

			{rentPeriod.adjustments.length > 0 ? (
				<ul className={styles.adjustmentList}>
					{rentPeriod.adjustments.map((adj, i) => (
						<li className={styles.adjustment} key={`${adj.type}-${i}`}>
							<span>
								{adj.label || t(`rentReceipts.adjustmentType.${ADJUSTMENT_TYPE_I18N_KEY[adj.type]}` as never)}
							</span>
							<span>{formatCents(adj.amountCents)}</span>
						</li>
					))}
				</ul>
			) : null}

			{rentPeriod.noticeSentAt ? (
				<p className={styles.cardNote}>
					{t('rentReceipts.card.noticeSentOn', { date: formatDateFr(rentPeriod.noticeSentAt) })}
				</p>
			) : null}

			{/* Toggle Oui/Non : feature centrale */}
			<div className={styles.toggleRow}>
				<span className={styles.toggleLabel}>{t('rentReceipts.card.toggleLabel')}</span>
				<div
					aria-label={t('rentReceipts.card.toggleAriaLabel')}
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
						{t('rentReceipts.card.yes')}
					</button>
					<button
						aria-pressed={!isPaid}
						className={classNames(styles.toggleBtn, !isPaid && styles.toggleBtnActive)}
						disabled={!isPaid || markUnpaid.isPending}
						onClick={handleRequestUnpaid}
						type="button"
					>
						{t('rentReceipts.card.no')}
					</button>
				</div>
			</div>

			{isPaid && rentPeriod.paidAt ? (
				<p className={styles.cardNote}>
					{t('rentReceipts.card.receiptGeneratedOn', { date: formatDateFr(rentPeriod.paidAt) })}
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
						{t('rentReceipts.card.cancelPayment')}
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
						{t('rentReceipts.card.sendNoticeNow')}
					</Button>
					<Button onPress={() => setAdjustModalOpen(true)} variant="outlined">
						{t('rentReceipts.card.addAdjustment')}
					</Button>
				</div>
			) : null}

			<ConfirmDialog
				description={t('rentReceipts.confirmUnpaid.description')}
				isOpen={confirmUnpaidOpen}
				isPending={markUnpaid.isPending}
				onConfirm={handleConfirmUnpaid}
				onOpenChange={setConfirmUnpaidOpen}
				title={t('rentReceipts.confirmUnpaid.title')}
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

const ADJUSTMENT_TYPE_I18N_KEY: Record<AdjustmentType, string> = {
	teom: 'teom',
	previous_balance: 'previousBalance',
	charges_regularization: 'chargesRegularization',
	other: 'other',
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
	const { t } = useTranslation();
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
		toast.success(t('rentReceipts.toast.adjustmentAdded'));
		onOpenChange(false);
	};

	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			size="sm"
			title={t('rentReceipts.adjustmentModal.title')}
		>
			<form className={styles.adjustmentForm} onSubmit={handleSubmit}>
				<SelectField
					label={t('rentReceipts.adjustmentModal.typeLabel')}
					onChange={(e) => setType(e.target.value as AdjustmentType)}
					options={ADJUSTMENT_TYPES}
					value={type}
				/>
				<TextField
					label={t('rentReceipts.adjustmentModal.labelFieldLabel')}
					onChange={(e) => setLabel(e.target.value)}
					placeholder={t(`rentReceipts.adjustmentType.${ADJUSTMENT_TYPE_I18N_KEY[type]}` as never)}
					type="text"
					value={label}
				/>
				<TextField
					hint={t('rentReceipts.adjustmentModal.amountHint')}
					label={t('rentReceipts.adjustmentModal.amountLabel')}
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
						{t('common.actions.cancel')}
					</Button>
					<Button isDisabled={patch.isPending} type="submit">
						{patch.isPending ? t('rentReceipts.adjustmentModal.submitting') : t('common.actions.add')}
					</Button>
				</div>
			</form>
		</Modal>
	);
};
