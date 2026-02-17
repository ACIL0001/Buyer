import { requests } from './api';
import { DirectSale } from '../types/direct-sale';
import { ApiResponse } from '../types/ApiResponse';

export const DirectSaleAPI = {
    getDirectSales: (): Promise<ApiResponse<DirectSale[]>> => requests.get('direct-sale'),
    getMyDirectSales: (): Promise<ApiResponse<DirectSale[]>> => requests.get('direct-sale/my-sales'),
    getDirectSaleById: (id: string): Promise<ApiResponse<DirectSale>> => requests.get(`direct-sale/${id}`),
    create: (data: FormData | Partial<DirectSale>): Promise<ApiResponse<DirectSale>> => requests.post('direct-sale', data, false, { timeout: 60000 }),
    update: (id: string, data: Partial<DirectSale>): Promise<ApiResponse<DirectSale>> => requests.put(`direct-sale/${id}`, data, { timeout: 60000 }),
    delete: (id: string): Promise<ApiResponse<void>> => requests.delete(`direct-sale/${id}`),
    purchase: (data: { directSaleId: string; quantity: number; paymentMethod?: string; paymentReference?: string }): Promise<ApiResponse<any>> =>
        requests.post('direct-sale/purchase', data),
    getMyPurchases: (): Promise<ApiResponse<any[]>> => requests.get('direct-sale/my-purchases'),
    getMyOrders: (): Promise<ApiResponse<any[]>> => requests.get('direct-sale/my-orders'),
    confirmPurchase: (purchaseId: string): Promise<ApiResponse<any>> =>
        requests.post(`direct-sale/purchase/${purchaseId}/confirm`, {}),
    getPurchasesByDirectSale: (id: string): Promise<ApiResponse<any[]>> =>
        requests.get(`direct-sale/${id}/purchases`),
};
