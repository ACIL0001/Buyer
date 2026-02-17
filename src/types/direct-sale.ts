export interface DirectSale {
    _id: string;
    title: string;
    description?: string;
    price: number;
    quantity: number;
    soldQuantity?: number;
    saleType?: 'PRODUCT' | 'SERVICE';
    status: SALE_STATUS;
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
    productSubCategory?: any;
    location?: string;
    place?: string;
    wilaya?: string;
    isPro?: boolean;
    hidden?: boolean;
    verifiedOnly?: boolean;
    contactNumber?: string;
    createdAt: string;
    updatedAt: string;
    category?: any;
    stock?: number;
    ordersCount?: number;
}

export enum SALE_STATUS {
    ACTIVE = 'ACTIVE',
    SOLD = 'SOLD',
    INACTIVE = 'INACTIVE',
    OUT_OF_STOCK = 'OUT_OF_STOCK',
    SOLD_OUT = 'SOLD_OUT',
    ARCHIVED = 'ARCHIVED',
    PAUSED = 'PAUSED'
}
