/**
 * FileUpload — composant unifié drop + click pour upload de documents.
 *
 * Combine `DropZone` (drag & drop) et `FileTrigger` (browse via input file)
 * de `react-aria-components`. Validation client (taille, type MIME) avec
 * remontée d'erreurs structurées via `onError`.
 *
 * Exemple d'usage ("Mon dossier" locataire) :
 *
 *   <FileUpload
 *     label="Bulletins de salaire"
 *     description="3 derniers mois — PDF ou photo"
 *     acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
 *     maxFileSize={20 * 1024 * 1024}
 *     multiple
 *     onFilesAdded={(files) => uploadMutation.mutate({ files, typeKey: 'payslip' })}
 *     onError={(errors) => errors.forEach((e) => toast.error(e.message))}
 *   />
 */
import classNames from 'classnames';
import { useCallback, useId, useMemo } from 'react';
import {
	Button as RACButton,
	DropZone,
	type DropItem,
	FileTrigger,
} from 'react-aria-components';

// `DropEvent` n'est pas re-exporté par react-aria-components dans la 1.18 ;
// on retype localement à partir de la forme observée (items + d'autres champs non utilisés ici).
interface LocalDropEvent {
	items: DropItem[];
}

import styles from './FileUpload.module.scss';

import type { FileUploadError, FileUploadProps } from './FileUpload.types';

export type { FileUploadError, FileUploadErrorReason, FileUploadProps } from './FileUpload.types';

const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const UploadCloudIcon = () => (
	<svg
		aria-hidden="true"
		className={styles.icon}
		fill="none"
		focusable="false"
		height="32"
		stroke="currentColor"
		strokeLinecap="round"
		strokeLinejoin="round"
		strokeWidth="1.75"
		viewBox="0 0 24 24"
		width="32"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M17 16.5A4.5 4.5 0 0 0 16.5 7.6 6 6 0 0 0 5 9a4 4 0 0 0 .4 8" />
		<path d="M12 12v8" />
		<path d="m8.5 15.5 3.5-3.5 3.5 3.5" />
	</svg>
);

const formatMegabytes = (bytes: number): string => {
	const mb = bytes / (1024 * 1024);
	return mb >= 10 ? `${Math.round(mb)} Mo` : `${mb.toFixed(1)} Mo`;
};

const getFileExtension = (file: File): string => {
	const dot = file.name.lastIndexOf('.');
	return dot >= 0 ? file.name.slice(dot) : file.name;
};

/**
 * Match a MIME type against an accepted list.
 *
 * Supports wildcard subtypes ("image/*") and exact matches.
 */
const isMimeAccepted = (mime: string, accepted: readonly string[]): boolean => {
	if (accepted.length === 0) {
		return true;
	}
	const lower = mime.toLowerCase();
	return accepted.some((entry) => {
		const e = entry.toLowerCase();
		if (e === lower) {
			return true;
		}
		if (e.endsWith('/*')) {
			const prefix = e.slice(0, -1); // "image/"
			return lower.startsWith(prefix);
		}
		return false;
	});
};

interface ValidationResult {
	accepted: File[];
	errors: FileUploadError[];
}

const validateFiles = (
	files: readonly File[],
	acceptedFileTypes: readonly string[] | undefined,
	maxFileSize: number,
): ValidationResult => {
	const accepted: File[] = [];
	const errors: FileUploadError[] = [];

	for (const file of files) {
		if (file.size > maxFileSize) {
			errors.push({
				file,
				reason: 'size',
				message: `Fichier trop volumineux (${formatMegabytes(file.size)} > ${formatMegabytes(maxFileSize)})`,
			});
			continue;
		}

		if (acceptedFileTypes && acceptedFileTypes.length > 0 && !isMimeAccepted(file.type, acceptedFileTypes)) {
			errors.push({
				file,
				reason: 'type',
				message: `Type de fichier non autorisé (${getFileExtension(file)})`,
			});
			continue;
		}

		accepted.push(file);
	}

	return { accepted, errors };
};

export const FileUpload = ({
	label,
	description,
	acceptedFileTypes,
	maxFileSize = DEFAULT_MAX_FILE_SIZE,
	multiple = true,
	disabled = false,
	onFilesAdded,
	onError,
}: FileUploadProps) => {
	const titleId = useId();
	const descriptionId = useId();

	const acceptedTuple = useMemo<readonly string[] | undefined>(
		() => (acceptedFileTypes ? [...acceptedFileTypes] : undefined),
		[acceptedFileTypes],
	);

	const handleFiles = useCallback(
		(rawFiles: readonly File[]) => {
			if (disabled || rawFiles.length === 0) {
				return;
			}
			const sliced = multiple ? rawFiles : rawFiles.slice(0, 1);
			const { accepted, errors } = validateFiles(sliced, acceptedTuple, maxFileSize);
			if (errors.length > 0) {
				onError?.(errors);
			}
			if (accepted.length > 0) {
				onFilesAdded(accepted);
			}
		},
		[acceptedTuple, disabled, maxFileSize, multiple, onError, onFilesAdded],
	);

	const handleDrop = useCallback(
		async (event: LocalDropEvent) => {
			if (disabled) {
				return;
			}
			const fileItems = event.items.filter(
				(item): item is Extract<DropItem, { kind: 'file' }> => item.kind === 'file',
			);
			// Folders (kind === 'directory') and text items are ignored — only individual files.
			const files = await Promise.all(fileItems.map((item) => item.getFile()));
			handleFiles(files);
		},
		[disabled, handleFiles],
	);

	const handleSelect = useCallback(
		(list: FileList | null) => {
			if (!list) {
				return;
			}
			handleFiles(Array.from(list));
		},
		[handleFiles],
	);

	return (
		<DropZone
			aria-labelledby={titleId}
			aria-describedby={description ? descriptionId : undefined}
			className={({ isDropTarget, isFocusVisible, isDisabled }) =>
				classNames(styles.dropzone, {
					[styles.active]: isDropTarget,
					[styles.focusVisible]: isFocusVisible,
					[styles.disabled]: isDisabled,
				})
			}
			isDisabled={disabled}
			onDrop={handleDrop}
		>
			<UploadCloudIcon />
			<span className={styles.label} id={titleId}>
				{label}
			</span>
			{description ? (
				<span className={styles.description} id={descriptionId}>
					{description}
				</span>
			) : null}
			<FileTrigger
				acceptedFileTypes={acceptedFileTypes}
				allowsMultiple={multiple}
				onSelect={handleSelect}
			>
				<RACButton className={styles.browseButton} isDisabled={disabled}>
					Parcourir
				</RACButton>
			</FileTrigger>
		</DropZone>
	);
};

FileUpload.displayName = 'FileUpload';
