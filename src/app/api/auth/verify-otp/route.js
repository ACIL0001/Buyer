// File: buyer/src/app/api/auth/verify-otp/route.js
import { NextResponse } from 'next/server';
import app from '@/config';

export async function POST(request) {
  try {
    const { phone, otp } = await request.json();
    
    // Validate input
    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, message: 'Phone and OTP are required' },
        { status: 400 }
      );
    }

    // Call your backend API to verify OTP
    const backendUrl = app.baseURL;
    // Format phone number: remove +213 and ensure it starts with 0
    let formattedPhone = phone;
    if (formattedPhone.startsWith('+213')) {
      formattedPhone = '0' + formattedPhone.slice(4);
    }

    const response = await fetch(`${backendUrl}otp/confirm-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        phone: formattedPhone,

        code: otp 
      })
    });
    
    // Safely attempt to parse JSON
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Backend returned non-JSON response:', text);
      throw new Error(`Backend returned status ${response.status} with non-JSON body`);
    }
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: data.message || 'OTP verified successfully',
        user: data.user,
        tokens: data.tokens
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || 'OTP verification failed' 
        }, 
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error during OTP verification' }, 
      { status: 500 }
    );
  }
}