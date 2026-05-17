// app/api/direct-sale.ts
import axios, { AxiosResponse } from 'axios';
import app from '@/config';

// Create a dedicated axios instance for direct sales
const directSaleInstance = axios.create({
  baseURL: app.baseURL,
  timeout: app.timeout,
  headers: { 'x-access-key': app.apiKey },
  withCredentials: true,
});

// Helper function to extract response body
const responseBody = (res: AxiosResponse) => res.data;

// Add request interceptor to include auth token if available
directSaleInstance.interceptors.request.use((config) => {
  try {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const auth = JSON.parse(authData);
      if (auth?.tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${auth.tokens.accessToken}`;
      }
    }
  } catch (error) {
    console.warn('Could not add auth token to request:', error);
  }
  
  return config;
});

// Network-level failures (no error.response) are transient during dev — warn so the
// Next.js dev overlay doesn't block the page. Real HTTP errors stay as error.
directSaleInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const payload = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    };
    if (!error.response) {
      console.warn('⚠️ Direct Sale API Error (network):', payload);
    } else {
      console.error('❌ Direct Sale API Error:', payload);
    }
    throw error;
  }
);

interface DirectSale {
  _id: string;
  id?: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  soldQuantity: number;
  saleType: 'PRODUCT' | 'SERVICE';
  status: 'ACTIVE' | 'SOLD_OUT' | 'INACTIVE' | 'ARCHIVED';
  thumbs?: Array<{ url: string; _id: string; filename?: string }>;
  videos?: Array<{ url: string; _id: string; filename?: string }>;
  owner?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    avatar?: { url: string };
  };
  productCategory?: {
    _id: string;
    name: string;
  };
  productSubCategory?: {
    _id: string;
    name: string;
  };
  wilaya: string;
  place: string;
  isPro: boolean;
  hidden: boolean;
  attributes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface Purchase {
  _id: string;
  directSale: DirectSale;
  buyer: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  seller: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export const DirectSaleAPI = {
  // Logging on failure is handled by the response interceptor above.
  getDirectSales: async (): Promise<DirectSale[]> => {
    const response = await directSaleInstance.get('direct-sale');
    return responseBody(response);
  },

  getDirectSaleById: async (id: string): Promise<DirectSale> => {
    if (!id) {
      throw new Error('Direct sale ID is required');
    }
    const response = await directSaleInstance.get(`direct-sale/${id}`);
    return responseBody(response);
  },

  purchase: async (data: {
    directSaleId: string;
    quantity: number;
    paymentMethod?: string;
    paymentReference?: string;
  }): Promise<Purchase> => {
    const response = await directSaleInstance.post('direct-sale/purchase', data);
    return responseBody(response);
  },

  getMyPurchases: async (): Promise<Purchase[]> => {
    const response = await directSaleInstance.get('direct-sale/my-purchases');
    return responseBody(response);
  },
};

