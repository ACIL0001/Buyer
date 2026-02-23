import { requests } from './api';
import { Auction } from '../types/auction';
import { ApiResponse } from '../types/ApiResponse';

export const AuctionsAPI = {
    getAuctions: (): Promise<ApiResponse<Auction[]>> => requests.get('bid/my-bids'),
    getAllAuctions: (): Promise<ApiResponse<Auction[]>> => requests.get('bid'),
    create: (data: FormData | Partial<Auction>): Promise<ApiResponse<Auction>> => requests.post('bid', data),
    getAuctionById: (id: string): Promise<ApiResponse<Auction>> => requests.get(`bid/${id}`),
    update: (id: string, data: Partial<Auction>): Promise<ApiResponse<Auction>> => requests.put(`bid/${id}`, data),
    accept: (id: string, winner: string): Promise<ApiResponse<Auction>> => requests.put(`bid/${id}`, {
        status: 'ACCEPTED',
        winner,
        winnerSelectedAt: new Date()
    }),
    getFinishedAuctions: (): Promise<ApiResponse<Auction[]>> => requests.get('bid/my-finished-bids'),
    relaunchAuction: (data: any): Promise<ApiResponse<Auction>> => requests.post('bid/relaunch', data),
    delayFeedback: (id: string): Promise<ApiResponse<any>> => requests.post(`bid/${id}/delay-feedback`, {}),
    saveFeedback: (id: string, data: { action: 'LIKE' | 'DISLIKE', reason?: string }): Promise<ApiResponse<any>> => requests.post(`bid/${id}/feedback`, data)
};
