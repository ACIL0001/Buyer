import { requests } from './api';

export const AuctionsAPI = {
    getAuctions: (): Promise<any> => requests.get('bid/my-bids'),
    getAllAuctions: (): Promise<any> => requests.get('bid'),
    create: (data: any): Promise<any> => requests.post('bid', data),
    getAuctionById: (id: string): Promise<any> => requests.get(`bid/${id}`),
    update: (id: string, data: any): Promise<any> => requests.put(`bid/${id}`, data),
    accept: (id: string, winner: string): Promise<any> => requests.put(`bid/${id}`, {
        status: 'ACCEPTED',
        winner,
        winnerSelectedAt: new Date()
    }),
    getFinishedAuctions: (): Promise<any> => requests.get('bid/my-finished-bids'),
    relaunchAuction: (data: any): Promise<any> => requests.post('bid/relaunch', data)
};
