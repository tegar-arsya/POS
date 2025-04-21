import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    console.log("MIDTRANS_SERVER_KEY:", process.env.MIDTRANS_SERVER_KEY);
    console.log("MIDTRANS_ENVIRONMENT:", process.env.MIDTRANS_ENVIRONMENT);
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      throw new Error('Midtrans server key not configured');
      console.log("MIDTRANS_SERVER_KEY:", process.env.MIDTRANS_SERVER_KEY);

    }

    const isProduction = process.env.MIDTRANS_ENVIRONMENT === 'production';
    const baseUrl = isProduction 
      ? 'https://app.midtrans.com' 
      : 'https://app.sandbox.midtrans.com';
    const apiUrl = `${baseUrl}/snap/v1/transactions`;

    const authString = Buffer.from(`${serverKey}:`).toString('base64');
    const body = await request.json();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { message: 'Midtrans API error', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Midtrans API error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}