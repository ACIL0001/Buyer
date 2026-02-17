import { requests } from './api';
import { ApiResponse } from '../types/ApiResponse';

export const OffersAPI = {
    getOffers: (data: any): Promise<ApiResponse<any[]>> =>
        requests.post('/offers/all', data),
    getOffersByBidId: (bidId: string): Promise<ApiResponse<any[]>> =>
        requests.get(`/offers/${bidId}`),
    acceptOffer: (id: string): Promise<ApiResponse<any>> =>
        requests.post(`/offers/${id}/accept`, {}),
    rejectOffer: (id: string): Promise<ApiResponse<any>> =>
        requests.post(`/offers/${id}/reject`, {}),
    deleteOffer: (id: string): Promise<ApiResponse<void>> =>
        requests.delete(`/offers/${id}`)
};
