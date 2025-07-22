
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerID = searchParams.get('CustomerID');
  const password = searchParams.get('Pin');
  console.log('<<In route>> customerID', customerID);
  console.log('password', password);

  if (!customerID || !password) {
    return NextResponse.json({ message: 'CustomerID and Pin are required' }, { status: 400 });
  }

  const externalApiUrl = `https://gps.spectrumvoice.com/api/caregiver/on-call?CustomerID=${customerID}&Pin=${password}`;

  try {
    const apiResponse = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    console.log('apiResponse', apiResponse);

    if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        // The external API might return non-JSON error messages
        return NextResponse.json({ message: `Error from external API: ${apiResponse.statusText}`, details: errorText }, { status: apiResponse.status });
    }
    
    const contentType = apiResponse.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await apiResponse.json();
        return NextResponse.json(data, { status: 200 });
    } else {
        const textData = await apiResponse.text();
        console.warn("Received non-JSON response from caregivers API:", textData);
        // If the external API returns a non-JSON response, it's often an empty string for "no caregivers".
        // In this case, we should return an empty array to the client.
        return NextResponse.json([], { status: 200 });
    }

  } catch (error) {
    console.error('Caregiver fetch proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown internal server error occurred."
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
