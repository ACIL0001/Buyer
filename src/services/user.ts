import { requests } from './api';
import User from '../types/User';
import { ApiResponse } from '../types/ApiResponse';

export const UserAPI = {
    reset: (): Promise<ApiResponse<void>> => requests.delete('users/change-password'),
    logout: (): Promise<ApiResponse<void>> => requests.delete('auth/signout'),
    get: (): Promise<ApiResponse<User>> => requests.get(`users/me`),
    findById: (id: string): Promise<ApiResponse<User>> => requests.get(`users/${id}`),
    setDevice: (device: { token: string; os: string }): Promise<ApiResponse<void>> => requests.post('user/update/device', device),
    setAvatar: (avatar: { url: string }): Promise<ApiResponse<User>> => requests.post('users/me/avatar', avatar),
    uploadAvatar: (formData: FormData): Promise<ApiResponse<User>> => requests.post('users/me/avatar', formData),
    updateProfile: (data: Partial<User>): Promise<ApiResponse<User>> => requests.put('users/me', data),
    uploadCover: (formData: FormData): Promise<ApiResponse<User>> => requests.post('users/me/cover', formData),
    setPhone: (data: { tel: string; code: string }): Promise<ApiResponse<void>> => requests.post('user/update/phone', data),
    changePassword: (credentials: { currentPassword?: string; newPassword: string }): Promise<ApiResponse<void>> => requests.post(`users/change-password`, credentials),
    identity: (form: FormData): Promise<ApiResponse<any>> => requests.post('identities', form),
    setSubscriptionPlan: (plan: string): Promise<ApiResponse<User>> => requests.put('users/subscription-plan', { plan }),
    updateSubscriptionPlan: (plan: string): Promise<ApiResponse<User>> => requests.put('users/subscription-plan', { plan }),
    // admin role
    getAll: (): Promise<ApiResponse<User[]>> => requests.get(`users/all`),
    getAdmins: (): Promise<ApiResponse<User[]>> => requests.get(`users/admins`),
    createAdmin: (data: Partial<User>): Promise<ApiResponse<User>> => requests.post(`users/admin`, data),
    enable: (id: string): Promise<ApiResponse<void>> => requests.get(`user/a/enable/${id}`),
    disable: (id: string): Promise<ApiResponse<void>> => requests.get(`user/a/disable/${id}`),
    getClients: (): Promise<ApiResponse<User[]>> => requests.get(`users/clients`),
};
