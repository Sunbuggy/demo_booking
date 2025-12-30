import { NextResponse } from 'next/server';

const NMI_SECURITY_KEY = process.env.NMI_SECURITY_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_token, amount, holder, booking } = body;

    if (!payment_token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing payment token' 
      }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid payment amount. Amount must be greater than 0' 
      }, { status: 400 });
    }

    if (!NMI_SECURITY_KEY) {
      console.error("NMI_SECURITY_KEY is not set in environment variables");
      return NextResponse.json({ 
        success: false, 
        error: 'Payment system configuration error' 
      }, { status: 500 });
    }

    // Convert amount from cents to dollars for NMI
    const formattedAmount = (amount / 100).toFixed(2);

    // Create the order ID
    const orderId = `PISMO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Prepare NMI request parameters
    const params = new URLSearchParams();
    params.append('security_key', NMI_SECURITY_KEY);
    params.append('payment_token', payment_token);
    params.append('transaction_type', 'sale');
    params.append('amount', formattedAmount);
    
    // Add customer info
    if (holder?.firstName) params.append('first_name', holder.firstName);
    if (holder?.lastName) params.append('last_name', holder.lastName);
    if (holder?.email) params.append('email', holder.email);
    if (holder?.phone) params.append('phone', holder.phone);
    
    // Add order details
    params.append('orderid', orderId);
    params.append('order_description', 'Pismo Beach Rentals Booking');
    
    // Add billing info (optional but recommended)
    params.append('address1', 'Not Provided');
    params.append('city', 'Not Provided');
    params.append('state', 'CA');
    params.append('zip', '93449');
    params.append('country', 'US');
    
    // Add merchant defined fields if needed
    if (booking) {
      // Ensure we don't exceed NMI's char limits for custom fields, simplify if needed
      params.append('merchant_defined_field_1', JSON.stringify(booking).substring(0, 255));
    }

    console.log("Sending request to NMI with order ID:", orderId);
    console.log("Amount:", formattedAmount);

    // Make request to NMI
    const response = await fetch('https://secure.nmi.com/api/transact.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const responseText = await response.text();
    console.log("NMI Raw Response:", responseText);
    
    // Parse the pipe-delimited response
    const responseParts = responseText.split('|');
    
    const responseCode = responseParts[1];
    const responseTextMsg = responseParts[2] || 'No response message';
    
    if (responseCode === '1') {
      return NextResponse.json({
        success: true,
        transaction_id: responseParts[0] || orderId,
        auth_code: responseParts[3] || '',
        order_id: orderId,
        message: 'Payment approved successfully',
      });
    } else {
      const errorMessage = responseParts[4] || responseTextMsg || 'Payment declined';
      console.error("NMI Payment Error:", { responseCode, errorMessage });
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        response_code: responseCode,
        response_text: responseTextMsg
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('NMI API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Payment processing error.' 
    }, { status: 500 });
  }
}