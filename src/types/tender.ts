export enum TENDER_TYPE {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

export enum TENDER_STATUS {
  OPEN = 'OPEN',
  AWARDED = 'AWARDED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
  CANCELLED = 'CANCELLED',
}

export enum TENDER_AUCTION_TYPE {
  CLASSIC = 'CLASSIC',
  EXPRESS = 'EXPRESS',
}

export interface Tender {
  _id: string;
  owner: any;
  title: string;
  description: string;
  requirements: string[];
  category: any;
  subCategory?: any;
  attachments: Array<{ _id?: string; url: string; filename?: string; fullUrl?: string }>;
  startingAt: string;
  endingAt: string;
  tenderType: TENDER_TYPE;
  auctionType: TENDER_AUCTION_TYPE;
  maxBudget: number;
  budget?: number; // legacy/ui fallback
  deadline?: string; // legacy/ui fallback
  bidsCount?: number; // legacy/ui fallback
  bids?: any[]; // legacy/ui fallback
  currentLowestBid: number;
  quantity?: string;
  wilaya: string;
  location: string;
  isPro: boolean;
  verifiedOnly?: boolean;
  hidden?: boolean;
  minimumPrice?: number;
  awardedTo?: any;
  status: TENDER_STATUS;
  comments: string[];
  createdAt: string;
  updatedAt: string;
  evaluationType?: 'MOINS_DISANT' | 'MIEUX_DISANT';
  contactNumber?: string;
  place?: string;
  // --- Image properties for enhanced image loading ---
  image?: string;
  thumbnail?: string;
  photo?: string;
  picture?: string;
  icon?: string;
  logo?: string;
  coverImage?: string;
  mainImage?: string;
}

export enum TenderBidStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

export interface TenderBid {
  _id: string;
  bidder: any;
  tenderOwner: any;
  tender: any;
  bidAmount: number;
  proposal?: string;
  deliveryTime?: number;
  status: TenderBidStatus;
  createdAt: string;
  updatedAt: string;
}
