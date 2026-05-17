
// app/api/auctions.ts
import axios, { AxiosResponse } from 'axios';
import app from '@/config';

// Create a dedicated axios instance for auctions
const auctionInstance = axios.create({
  baseURL: app.baseURL,
  timeout: app.timeout,
  headers: { 'x-access-key': app.apiKey },
  withCredentials: true,
});

// Helper function to extract response body
const responseBody = (res: AxiosResponse) => res.data;

// Add request interceptor to include auth token if available
auctionInstance.interceptors.request.use((config) => {
  // Try to get auth token from localStorage or session
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

// Network-level failures (no error.response) are transient during dev (backend not yet
// ready, offline, CORS). Log them as warn so the Next.js dev overlay doesn't block the
// page. Real HTTP errors (4xx/5xx) still log as error.
const logAuctionFailure = (label: string, error: any) => {
  const payload = {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    message: error.message,
    code: error.code,
  };
  if (!error.response) {
    console.warn(`⚠️ ${label} (network):`, payload);
  } else {
    console.error(`❌ ${label}:`, payload);
  }
};

// Add response interceptor for better error handling
auctionInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    logAuctionFailure('Auctions API Error', error);

    // Enhance error object with more context
    error.apiContext = {
      baseURL: app.baseURL,
      endpoint: error.config?.url,
      method: error.config?.method,
      timestamp: new Date().toISOString()
    };

    throw error;
  }
);

interface Auction {
  id: string;
  title: string;
  description?: string;
  startingPrice: number;
  currentPrice: number;
  endTime: string;
  status: string;
  images?: string[];
  sellerId: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  isPro?: boolean; // Professional auction flag
  hidden?: boolean; // Anonymous seller flag
  bidType?: 'PRODUCT' | 'SERVICE';
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export const AuctionsAPI = {
  getAuctions: async (): Promise<ApiResponse<Auction[]>> => {
    // Logging on failure is handled by the response interceptor above.
    const response = await auctionInstance.get('bid');
    return responseBody(response);
  },

  getAuctionById: async (id: string): Promise<ApiResponse<Auction>> => {
    if (!id) {
      throw new Error('Auction ID is required');
    }
    const response = await auctionInstance.get(`bid/${id}`);
    if (!response.data) {
      throw new Error('Empty response from server');
    }
    return responseBody(response);
  },
};