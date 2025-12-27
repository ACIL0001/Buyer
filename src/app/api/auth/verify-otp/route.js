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

    // Ensure we always send the local number format (0xxxxxxxxx)
    // If the input has +213, remove it and add 0
    let formattedPhone = phone;
    if (formattedPhone.startsWith('+213')) {
      formattedPhone = '0' + formattedPhone.slice(4);
    } else if (!formattedPhone.startsWith('0')) {
       // Optional: Add 0 if missing and not +213? 
       // For now, assume if it's not +213 it might be 55... or 055... 
       // If it doesn't start with 0, prepend it (safer for local format)
       formattedPhone = '0' + formattedPhone;
    }
    
    // If it already starts with 0 (e.g. 055...), keep it as is.
    
    console.log(`📡 Verifying OTP for phone: ${formattedPhone} (original: ${phone}), code: ${otp}`);
    const requestUrl = `${backendUrl}otp/confirm-phone`;

    const response = await fetch(requestUrl, {
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