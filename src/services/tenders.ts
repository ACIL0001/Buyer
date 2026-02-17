import { requests } from './api';
import { Tender, TenderBid } from '../types/tender';
import { ApiResponse } from '../types/ApiResponse';

export const TendersAPI = {
    getTenders: (): Promise<ApiResponse<Tender[]>> => requests.get('tender/my-tenders'),
    getAllTenders: (): Promise<ApiResponse<Tender[]>> => requests.get('tender'),
    create: (data: FormData | Partial<Tender>): Promise<ApiResponse<Tender>> => requests.post('tender', data),
    getTenderById: (id: string): Promise<ApiResponse<Tender>> => requests.get(`tender/${id}`),
    update: (id: string, data: Partial<Tender>): Promise<ApiResponse<Tender>> => requests.put(`tender/${id}`, data),
    createTenderBid: (id: string, data: Partial<TenderBid>): Promise<ApiResponse<TenderBid>> => requests.post(`tender/${id}/bid`, data),
    getTenderBids: (id: string): Promise<ApiResponse<TenderBid[]>> => requests.get(`tender/${id}/bids`),
    getTenderBidsByOwner: (ownerId: string): Promise<ApiResponse<TenderBid[]>> => requests.get(`tender/owner/${ownerId}/bids`),
    getTenderBidsByBidder: (bidderId: string): Promise<ApiResponse<TenderBid[]>> => requests.get(`tender/bidder/${bidderId}/bids`),
    getTenderBidById: (id: string): Promise<ApiResponse<TenderBid>> => requests.get(`tender/bids/${id}`),
    acceptTenderBid: (bidId: string): Promise<ApiResponse<TenderBid>> => requests.post(`tender/bids/${bidId}/accept`, {}),
    rejectTenderBid: (bidId: string): Promise<ApiResponse<TenderBid>> => requests.post(`tender/bids/${bidId}/reject`, {}),
    deleteTender: (tenderId: string): Promise<ApiResponse<void>> => requests.delete(`tender/${tenderId}`),
};
