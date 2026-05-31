import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, type components } from './client';

export type DocumentItem = components['schemas']['Document'];
export type DocumentStatus = DocumentItem['statusKey'];

export const DOCUMENTS_QUERY_KEY = ['documents'] as const;
export const DOCUMENT_TYPES_QUERY_KEY = ['document-types'] as const;

export interface DocumentsFilters {
	leaseId?: string;
	propertyId?: string;
	documentTypeKey?: string;
	statusKey?: DocumentStatus;
}

/**
 * Liste les documents accessibles à l'utilisateur courant.
 * - Landlord : tous ses documents
 * - Tenant/Guarantor : documents des baux où ils sont partie
 */
export function useDocuments(filters: DocumentsFilters = {}) {
	return useQuery({
		queryKey: [...DOCUMENTS_QUERY_KEY, filters] as const,
		queryFn: async () => {
			const { data, response } = await api.GET('/api/documents', { params: { query: filters } });
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
	});
}

export type DocumentRole = 'landlord' | 'tenant' | 'guarantor';

/**
 * Whitelist des types de documents qu'un rôle peut uploader.
 * Retour : liste de keys i18n (ex: 'insurance_certificate', 'payslip', ...)
 */
export function useDocumentTypes(role: DocumentRole) {
	return useQuery({
		queryKey: [...DOCUMENT_TYPES_QUERY_KEY, role] as const,
		queryFn: async () => {
			const { data, response } = await api.GET('/api/document-types', { params: { query: { role } } });
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
		staleTime: 5 * 60 * 1000, // 5 minutes : la whitelist change rarement
	});
}

/**
 * Upload d'un document via multipart/form-data.
 * Bypass d'openapi-fetch car les types ne gèrent pas FormData proprement.
 */
export function useUploadDocument() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (vars: {
			file: File;
			documentTypeKey: string;
			leaseId?: string;
			propertyId?: string;
			periodMonth?: string;
		}) => {
			const formData = new FormData();
			formData.append('file', vars.file);
			formData.append('documentTypeKey', vars.documentTypeKey);
			if (vars.leaseId) formData.append('leaseId', vars.leaseId);
			if (vars.propertyId) formData.append('propertyId', vars.propertyId);
			if (vars.periodMonth) formData.append('periodMonth', vars.periodMonth);

			const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
			const response = await fetch(`${baseUrl}/api/documents`, {
				method: 'POST',
				body: formData,
				credentials: 'include',
			});
			if (!response.ok) {
				const body = await response.text();
				throw new Error(`HTTP ${response.status} : ${body}`);
			}
			return (await response.json()) as DocumentItem;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
		},
	});
}

/**
 * Crée un lien de partage public pour un document. TTL côté serveur (7j default).
 */
export function useCreateDocumentShare() {
	return useMutation({
		mutationFn: async (vars: { documentId: string; ttlDays?: number }) => {
			const { data, response } = await api.POST('/api/document-shares', {
				body: { documentId: vars.documentId, ttlDays: vars.ttlDays ?? 7 },
			});
			if (!data) throw new Error(`HTTP ${response.status}`);
			return data;
		},
	});
}

/**
 * URL absolue de téléchargement d'un document. Utilisé pour les <a href=...> directs.
 * Le navigateur enverra automatiquement le cookie de session.
 */
export function getDocumentDownloadUrl(id: string): string {
	const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
	return `${baseUrl}/api/documents/${id}/download`;
}
