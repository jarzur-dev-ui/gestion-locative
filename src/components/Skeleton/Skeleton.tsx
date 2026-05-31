import classNames from 'classnames';
import type { CSSProperties } from 'react';

import styles from './Skeleton.module.scss';

import type { SkeletonProps } from './Skeleton.types';

export type { SkeletonProps } from './Skeleton.types';

export const Skeleton = ({ lines = 3, className, height }: SkeletonProps) => (
	<div className={classNames(styles.container, className)}>
		{Array.from({ length: lines }).map((_, i) => (
			<div
				className={styles.line}
				key={i}
				style={
					height
						? ({
								'--skeleton-height': typeof height === 'number' ? `${height}px` : height,
							} as CSSProperties)
						: undefined
				}
			/>
		))}
	</div>
);
