export type FileUploadErrorReason = 'size' | 'type';

export interface FileUploadError {
	file: File;
	reason: FileUploadErrorReason;
	message: string;
}

export interface FileUploadProps {
	// Présentation
	label: string;
	description?: string;
	/** MIME types autorisés, ex. ['application/pdf', 'image/jpeg', 'image/png']. Wildcards supportés ('image/*'). */
	acceptedFileTypes?: string[];
	/** Taille max en bytes. Par défaut : 20 MB. */
	maxFileSize?: number;
	/** Autoriser plusieurs fichiers à la fois. Par défaut : true. */
	multiple?: boolean;
	disabled?: boolean;

	// Callbacks
	onFilesAdded: (files: File[]) => void;
	onError?: (errors: FileUploadError[]) => void;
}
