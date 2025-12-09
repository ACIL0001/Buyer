import { requests } from './api';

export const OffersAPI = {
    getOffers: (data: any): Promise<any> =>
        requests.post('/offers/all', data),
    acceptOffer: (id: string): Promise<any> =>
        requests.put(`/offers/${id}/accept`, {}),
    rejectOffer: (id: string): Promise<any> =>
        requests.put(`/offers/${id}/reject`, {}),
    deleteOffer: (id: string): Promise<any> =>
        requests.delete(`/offers/${id}`)
};
