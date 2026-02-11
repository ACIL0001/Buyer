// File: buyer/src/app/api/auth/resend-otp/route.js
import { NextResponse } from 'next/server';
import app from '@/config';

const backendUrl = app.baseURL;

export async function POST(request) {
  try {
    const { phone } = await request.json();
    
    // Validate input
    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Call your backend API to resend OTP
    // Format phone: if starts with +213, replace with 0.
    // Ensure always starts with 0 for local format.
    let formattedPhone = phone;
    if (formattedPhone.startsWith('+213')) {
      formattedPhone = '0' + formattedPhone.slice(4);
    } else if (!formattedPhone.startsWith('0')) {
      formattedPhone = '0' + formattedPhone;
    }
    
    // Pass the clean local phone number
    const response = await fetch(`${backendUrl}otp/resend/confirm-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: formattedPhone })
    });
    
    if (response.ok) {
      const data = await response.text(); 
      return NextResponse.json({
        success: true,
        message: 'OTP resent successfully'
      });
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Failed to resend OTP' }));
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Failed to resend OTP' 
        }, 
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during OTP resend' }, 
      { status: 500 }
    );
  }
}