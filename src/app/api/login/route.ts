
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, pin } = await request.json();

    if (!email || !pin) {
      return NextResponse.json({ message: 'Email and pin are required' }, { status: 400 });
    }

    const apiPayload = {
      email,
      pin: pin,  
    };

    const apiResponse = await fetch('https://gps.spectrumvoice.com/api/caregiver/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });

    // We need to check the content-type to avoid trying to parse JSON from a non-JSON response
    const contentType = apiResponse.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await apiResponse.json();
        return NextResponse.json(data, { status: apiResponse.status });
    } else {
        // If the response is not JSON, we return the text and status
        const textData = await apiResponse.text();
        return new Response(textData, { status: apiResponse.status });
    }

  } catch (error) {
    console.error('Login proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown internal server error occurred."
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
