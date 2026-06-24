import { requests } from './api';
import { ApiResponse } from '../types/ApiResponse';

export const IdentityAPI = {
    // Professional identity submission (existing professionals or client-to-professional with new required fields)
    create: (formData: FormData): Promise<ApiResponse<any>> => requests.post('/identities', formData),

    // Client to reseller conversion (identity card only)
    createResellerIdentity: (formData: FormData): Promise<ApiResponse<any>> => requests.post('/identities/reseller', formData),

    // Client to professional conversion (with new required fields)
    createProfessionalIdentity: (formData: FormData): Promise<ApiResponse<any>> => requests.post('/identities/professional', formData),

    // Get current user's identity
    getMy: (): Promise<ApiResponse<any>> => requests.get('/identities/me'),
    getMyIdentity: (): Promise<ApiResponse<any>> => requests.get('/identities/me'),

    // Update document
    updateDocument: (identityId: string, fieldKey: string, file: File): Promise<ApiResponse<any>> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('field', fieldKey); // Backend expects 'field' not 'fieldKey'
        return requests.put(`/identities/${identityId}/update-document`, formData);
    },

    // Submit identity for admin review
    submitIdentity: (identityId: string): Promise<ApiResponse<any>> =>
        requests.put(`/identities/${identityId}/submit`, {}),

    // Submit certification documents for admin review
    submitCertification: (identityId: string): Promise<ApiResponse<any>> =>
        requests.put(`/identities/${identityId}/submit-certification`, {}),

    // Legacy methods (keeping for backward compatibility)
    upload: (form: FormData): Promise<ApiResponse<any>> => requests.post('/identities', form),
    update: (status: any): Promise<ApiResponse<any>> => requests.post('identity/r/update', status),
    get: (): Promise<ApiResponse<any[]>> => requests.get('identity/r/all'),
    remove: (id: string): Promise<ApiResponse<void>> => requests.delete(`identity/r/remove/${id}`),
    uploadProfessionalDocuments: (formData: FormData): Promise<ApiResponse<any>> => requests.post('identity/professional/upload', formData),
};
