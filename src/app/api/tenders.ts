// Buyer-side tenders API
import { requests } from './utils';

export const TendersAPI = {
  // Get all active tenders
  getActiveTenders: (): Promise<any> => requests.get('tender'),

  // Get specific tender by ID
  getTenderById: (id: string): Promise<any> => requests.get(`tender/${id}`),

  // Submit a bid on a tender
  submitTenderBid: (tenderId: string, bid: FormData | Record<string, any>): Promise<any> => {
    console.log('Submitting tender bid:', { tenderId, isFormData: bid instanceof FormData });
    if (bid instanceof FormData) {
      return requests.postFormData(`tender/${tenderId}/bid`, bid);
    }
    return requests.post(`tender/${tenderId}/bid`, bid);
  },

  // Get bids for a specific tender
  getTenderBids: (tenderId: string): Promise<any> =>
    requests.get(`tender/${tenderId}/bids`),

  // Get tender bids made by current user (buyer perspective)
  getMyTenderBids: (userId: string): Promise<any> =>
    requests.get(`tender/bidder/${userId}/bids`),

  // Get tender bids by owner (for tender owners to see all bids)
  getTenderBidsByOwner: (ownerId: string): Promise<any> =>
    requests.get(`tender/owner/${ownerId}/bids`),
};
