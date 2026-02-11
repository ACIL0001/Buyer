
import { NextRequest, NextResponse } from 'next/server';
import app from '@/config';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ type: string, id: string }> }
) {
    const { type, id } = await params;

    let apiUrl = '';

    if (type === 'direct-sale') {
        apiUrl = `${app.baseURL}direct-sales/${id}`;
    } else if (type === 'tender') {
        apiUrl = `${app.baseURL}tenders/${id}`;
    } else if (type === 'auction') {
        apiUrl = `${app.baseURL}bid/${id}`;
    } else {
        return NextResponse.json({
            success: false,
            error: 'Invalid type. Use direct-sale, tender, or auction',
        });
    }

    try {
        const res = await fetch(apiUrl, {
            headers: {
                'x-access-key': app.apiKey,
                'Content-Type': 'application/json'
            },
            cache: 'no-store'
        });

        const data = await res.json();

        return NextResponse.json({
            success: true,
            apiUrl,
            status: res.status,
            data,
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            apiUrl,
        });
    }
}
