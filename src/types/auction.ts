export interface Auction {
    id: string;
    title: string;
    name?: string;
    thumbs?: Array<{ _id: string; url: string; filename?: string; fullUrl?: string }>;
    endingAt?: string;
    endDate?: string;
    currentPrice?: number;
    startingPrice?: number;
    isPro?: boolean;
    hidden?: boolean;
    seller?: {
        _id: string;
        name?: string;
        profileImage?: { url: string; };
        photoURL?: string;
    };
    owner?: {
        _id: string;
        firstName?: string;
        lastName?: string;
        name?: string;
        entreprise?: string;
        companyName?: string;
        profileImage?: { url: string; };
        photoURL?: string;
    } | string;
    status?: string;
    verifiedOnly?: boolean;
    quantity?: string | number;
    location?: string;
    wilaya?: string;
    place?: string;
    address?: string;
    description?: string;
    biddersCount?: number;
    participantsCount?: number;
    bidType?: 'PRODUCT' | 'SERVICE';
    images?: string[];
    image?: string;
    thumbnail?: string;
    photo?: string;
    picture?: string;
    icon?: string;
    logo?: string;
    coverImage?: string;
    mainImage?: string;
}
