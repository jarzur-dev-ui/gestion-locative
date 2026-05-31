// Wrapper Tabs basé sur react-aria-components.
//
// Deux variantes :
//   - default : tabs horizontales classiques avec un underline sous l'onglet actif.
//   - wizard  : étapes numérotées avec connecteurs (utilisé pour le wizard du bail
//               Bien → Locataires → Garants → Conditions). Affiche une coche verte
//               sur les étapes complétées (via `completedKeys`).
//
// Exemple default :
//   <Tabs
//     selectedKey={currentTab}
//     onSelectionChange={setCurrentTab}
//     tabs={[
//       { key: 'general', label: 'Informations', panel: <GeneralForm /> },
//       { key: 'address', label: 'Adresse', panel: <AddressForm /> },
//     ]}
//   />
//
// Exemple wizard :
//   <Tabs
//     variant="wizard"
//     selectedKey={step}
//     onSelectionChange={setStep}
//     completedKeys={completedSteps}
//     tabs={[
//       { key: 'property', label: 'Bien', panel: <Step1 /> },
//       { key: 'tenants', label: 'Locataires', panel: <Step2 />, disabled: !completedSteps.includes('property') },
//     ]}
//   />

import classNames from 'classnames';
import {
	Tab,
	TabList,
	TabPanel,
	Tabs as RACTabs,
	type Key,
} from 'react-aria-components';

import styles from './Tabs.module.scss';

import type { TabsProps } from './Tabs.types';

export type { TabItem, TabsProps, TabsVariant } from './Tabs.types';

const CheckIcon = () => (
	<svg
		aria-hidden="true"
		className={styles.checkIcon}
		fill="none"
		focusable="false"
		height="14"
		viewBox="0 0 16 16"
		width="14"
	>
		<path
			d="M3 8.5L6.5 12L13 5"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
		/>
	</svg>
);

export const Tabs = ({
	selectedKey,
	onSelectionChange,
	tabs,
	variant = 'default',
	completedKeys = [],
}: TabsProps) => {
	const isWizard = variant === 'wizard';
	const disabledKeys = tabs.filter((t) => t.disabled).map((t) => t.key);

	const handleSelectionChange = (key: Key): void => {
		onSelectionChange(String(key));
	};

	return (
		<RACTabs
			className={classNames(styles.tabs, isWizard ? styles.wizard : styles.default)}
			disabledKeys={disabledKeys}
			onSelectionChange={handleSelectionChange}
			selectedKey={selectedKey}
		>
			<TabList
				aria-label="Tabs"
				className={classNames(styles.tabList, isWizard && styles.tabListWizard)}
			>
				{tabs.map((tab, index) => {
					const isCompleted = completedKeys.includes(tab.key);
					const isCurrent = tab.key === selectedKey;
					const stepState = isCompleted
						? 'completed'
						: isCurrent
							? 'current'
							: 'future';
					const nextCompleted =
						isWizard && index < tabs.length - 1 && completedKeys.includes(tab.key);

					return (
						<div className={isWizard ? styles.stepWrapper : undefined} key={tab.key}>
							<Tab
								className={classNames(
									isWizard ? styles.tabWizard : styles.tab,
									isWizard && styles[`state-${stepState}`],
								)}
								id={tab.key}
							>
								{isWizard ? (
									<>
										<span
											aria-hidden="true"
											className={classNames(
												styles.stepIndicator,
												styles[`indicator-${stepState}`],
											)}
										>
											{isCompleted ? <CheckIcon /> : index + 1}
										</span>
										<span className={styles.stepLabel}>{tab.label}</span>
									</>
								) : (
									tab.label
								)}
							</Tab>
							{isWizard && index < tabs.length - 1 ? (
								<span
									aria-hidden="true"
									className={classNames(
										styles.connector,
										nextCompleted && styles.connectorActive,
									)}
								/>
							) : null}
						</div>
					);
				})}
			</TabList>
			{tabs.map((tab) => (
				<TabPanel className={styles.tabPanel} id={tab.key} key={tab.key}>
					{tab.panel}
				</TabPanel>
			))}
		</RACTabs>
	);
};
