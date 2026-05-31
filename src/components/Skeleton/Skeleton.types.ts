export interface SkeletonProps {
	/** Nombre de lignes (par défaut 3). */
	lines?: number;
	className?: string;
	/** Hauteur d'une ligne (number = px, ou CSS value type '40px' / '3rem'). */
	height?: number | string;
}
