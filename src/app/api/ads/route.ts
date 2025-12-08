import { NextRequest, NextResponse } from 'next/server';
import app from '@/config';

const API_BASE_URL = app.baseURL;

export async function GET(req: NextRequest) {
  try {
    // Forward the request to the backend
    const response = await fetch(`${API_BASE_URL}ads`, {
      method: 'GET',
      headers: {
        'x-access-key': app.apiKey || process.env.NEXT_PUBLIC_KEY_API_BYUER || '',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    // If backend endpoint doesn't exist (404) or other error, return empty array
    // This allows the frontend to work even if backend hasn't implemented the endpoint yet
    if (!response.ok) {
      if (response.status === 404) {
        console.warn('Ads endpoint not found on backend, returning empty array');
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
      // For other errors, still return empty array to prevent frontend crashes
      console.warn('Error fetching ads from backend:', response.status);
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const data = await response.json();
    
    // Filter active and displayed ads on the server side as well
    let adsData = [];
    if (Array.isArray(data)) {
      adsData = data;
    } else if (data?.data && Array.isArray(data.data)) {
      adsData = data.data;
    } else if (data?.success && data?.data && Array.isArray(data.data)) {
      adsData = data.data;
    }
    
    const filteredAds = adsData.filter((ad: any) => 
      ad.isActive === true && ad.isDisplayed === true
    );
    
    // Sort by order
    filteredAds.sort((a: any, b: any) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      return orderA - orderB;
    });
    
    return NextResponse.json({
      success: true,
      data: filteredAds,
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    // Return empty array instead of error to prevent frontend crashes
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}

