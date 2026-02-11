export interface DirectSale {
    _id: string;
    title: string;
    description?: string;
    price: number;
    quantity: number;
    soldQuantity?: number;
    saleType?: 'PRODUCT' | 'SERVICE';
    status: 'ACTIVE' | 'SOLD_OUT' | 'INACTIVE' | 'ARCHIVED' | 'SOLD' | 'PAUSED';
    thumbs?: Array<{ _id: string; url: string; filename?: string; fullUrl?: string }>;
    videos?: Array<{ _id: string; url: string; filename?: string; fullUrl?: string }>;
    owner?: {
        _id: string;
        firstName?: string;
        lastName?: string;
        username?: string;
        entreprise?: string;
        companyName?: string;
        avatar?: { url: string; };
        photoURL?: string;
    } | string;
    productCategory?: {
        name: string;
    };
    location?: string;
    place?: string;
    wilaya?: string;
    isPro?: boolean;
    hidden?: boolean;
    verifiedOnly?: boolean;
}
