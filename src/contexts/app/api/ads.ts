import { requests } from './utils';

export interface Ad {
  _id: string;
  title: string;
  image: string | {
    _id: string;
    url: string;
    filename: string;
  };
  url: string;
  isActive: boolean;
  isDisplayed: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export const AdsAPI = {
  getAds: async (): Promise<ApiResponse<Ad[]>> => {
    try {
      // Use Next.js API route instead of calling backend directly
      // This allows the route to handle backend errors gracefully
      const res = await fetch('/api/ads', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        // If the API route returns an error, return empty array
        console.warn('Ads API route returned error:', res.status);
        return {
          success: false,
          data: [],
          message: 'Failed to fetch ads',
        } as ApiResponse<Ad[]>;
      }

      const data = await res.json();
      let adsData: Ad[] = [];
      
      if (data && 'success' in data && 'data' in data) {
        adsData = Array.isArray(data.data) ? data.data : [];
      } else if (Array.isArray(data)) {
        adsData = data;
      } else if (data?.data && Array.isArray(data.data)) {
        adsData = data.data;
      }
      
      // Filter ads to only return those with isActive: true and isDisplayed: true
      const filteredAds = Array.isArray(adsData) 
        ? adsData.filter((ad: Ad) => ad.isActive === true && ad.isDisplayed === true)
        : [];
      
      // Sort by order if available
      filteredAds.sort((a: Ad, b: Ad) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return orderA - orderB;
      });
      
      return {
        success: true,
        data: filteredAds,
        message: data?.message,
      } as ApiResponse<Ad[]>;
    } catch (error: unknown) {
      console.error('Error fetching ads:', error);
      // Return empty array instead of throwing error to prevent UI crashes
      return {
        success: false,
        data: [],
        message: 'Failed to fetch ads',
      } as ApiResponse<Ad[]>;
    }
  },
};

