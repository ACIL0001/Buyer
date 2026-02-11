import { requests } from './api';

export const OffersAPI = {
    getOffers: (data: any): Promise<any> =>
        requests.post('/offers/all', data),
    getOffersByBidId: (bidId: string): Promise<any> =>
        requests.get(`/offers/${bidId}`),
    acceptOffer: (id: string): Promise<any> =>
        requests.post(`/offers/${id}/accept`, {}),
    rejectOffer: (id: string): Promise<any> =>
        requests.post(`/offers/${id}/reject`, {}),
    deleteOffer: (id: string): Promise<any> =>
        requests.delete(`/offers/${id}`)
};
