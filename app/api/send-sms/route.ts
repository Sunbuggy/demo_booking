import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { message: 'Method not allowed' },
      { status: 405 }
    );
  }

  const { text, to_numbers } = await req.json();

  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      infer_country_code: false,
      user_id: 6293603667378176,
      text: text,
      to_numbers: to_numbers
    })
  };

  try {
    const response = await fetch(
      `https://dialpad.com/api/v2/sms?apikey=${process.env.DIALPAD_API_KEY}`,
      options
    );
    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        message: 'Text messages sent successfully',
        data
      });
    } else {
      return NextResponse.json(
        { message: 'Failed to send text messages', data },
        { status: response.status }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Error sending SMS', error: (error as Error).message },
      { status: 500 }
    );
  }
}
