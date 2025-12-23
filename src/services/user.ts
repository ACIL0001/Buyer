import { requests } from './api';

export const UserAPI = {
    reset: (): Promise<any> => requests.delete('users/change-password'),
    logout: (): Promise<any> => requests.delete('auth/signout'),
    get: () => requests.get(`users/me`),
    findById: (id: string): Promise<any> => requests.get(`users/${id}`),
    setDevice: (device: any): Promise<any> => requests.post('user/update/device', device),
    setAvatar: (avatar: any): Promise<any> => requests.post('users/me/avatar', avatar),
    uploadAvatar: (formData: FormData): Promise<any> => requests.post('users/me/avatar', formData),
    updateProfile: (data: any): Promise<any> => requests.put('users/me', data),
    setPhone: (data: any): Promise<any> => requests.post('user/update/phone', data), // { tel, code }
    changePassword: (credentials: any) => requests.post(`users/change-password`, credentials),
    identity: (form: FormData): Promise<any> => requests.post('identities', form),
    setSubscriptionPlan: (plan: string): Promise<any> => requests.put('users/subscription-plan', { plan }),
    updateSubscriptionPlan: (plan: string): Promise<any> => requests.put('users/subscription-plan', { plan }),
    // admin role
    getAll: () => requests.get(`users/all`),
    getAdmins: (): Promise<any> => requests.get(`users/admins`),
    createAdmin: (data: any): Promise<any> => requests.post(`users/admin`, data),
    enable: (id: string): Promise<any> => requests.get(`user/a/enable/${id}`),
    disable: (id: string): Promise<any> => requests.get(`user/a/disable/${id}`),
    // Additional methods for missing functions
    getClients: (): Promise<any> => requests.get(`users/clients`),
    getRestaurants: (): Promise<any> => requests.get(`users/restaurants`),
    getRiders: (): Promise<any> => requests.get(`users/riders`),
};
