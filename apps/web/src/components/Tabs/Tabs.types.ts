import type { ReactNode } from 'react';

export type TabsVariant = 'default' | 'wizard';

export interface TabItem {
	key: string;
	label: string;
	panel: ReactNode;
	disabled?: boolean;
}

export interface TabsProps {
	/** Clé de l'onglet sélectionné (controlled). */
	selectedKey: string;
	onSelectionChange: (key: string) => void;
	tabs: TabItem[];
	/**
	 * 'default' = tabs horizontales classiques (underline).
	 * 'wizard'  = étapes numérotées + check icon si complétée + connecteurs colorés.
	 */
	variant?: TabsVariant;
	/** Pour variant='wizard' : liste des étapes complétées (affichage check + connecteur coloré). */
	completedKeys?: string[];
}
