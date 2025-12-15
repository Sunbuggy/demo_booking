// import { NextRequest, NextResponse } from 'next/server';
// import { payarcClient } from '@/utils/payarc-helper/client';

// export const dynamic = 'force-dynamic';
// export const runtime = 'nodejs';

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
    
//     // Validate required fields
//     const { amount, order_id, customer_email, customer_first_name } = body;
    
//     if (!amount || amount <= 0) {
//       return NextResponse.json(
//         { error: 'Valid amount is required' },
//         { status: 400 }
//       );
//     }
    
//     if (!order_id) {
//       return NextResponse.json(
//         { error: 'Order ID is required' },
//         { status: 400 }
//       );
//     }

//     // Get base URL
//     const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
//                    `${request.nextUrl.protocol}//${request.nextUrl.host}`;

//     // Create payment session
//     const session = await payarcClient.createPaymentSession({
//       amount: parseFloat(amount),
//       currency: 'USD',
//       order_id: order_id.toString(),
//       customer_email: customer_email || 'customer@example.com',
//       customer_first_name: customer_first_name || 'Customer',
//       customer_last_name: body.customer_last_name || '',
//       return_url: `${baseUrl}/booking/confirmation?order_id=${order_id}`,
//       cancel_url: `${baseUrl}/booking?canceled=true`,
//       metadata: body.metadata || {}
//     });

//     return NextResponse.json({
//       success: true,
//       session_id: session.session_id,
//       hpp_url: session.hosted_payment_url,
//       transaction_id: session.transaction_id,
//       expires_at: session.expires_at,
//       order_id: order_id,
//       amount: amount
//     });

//   } catch (error: any) {
//     console.error('PayArc API Error:', error);
    
//     let errorMessage = 'Failed to create payment session';
//     let statusCode = 500;
    
//     if (error.response?.status === 401) {
//       errorMessage = 'Invalid PayArc credentials. Please check your Merchant ID and Secret Key.';
//       statusCode = 401;
//     } else if (error.response?.status === 400) {
//       errorMessage = `Invalid request: ${JSON.stringify(error.response.data)}`;
//       statusCode = 400;
//     } else if (error.message.includes('credentials')) {
//       errorMessage = 'PayArc credentials not configured';
//       statusCode = 500;
//     }

//     return NextResponse.json(
//       { 
//         success: false,
//         error: errorMessage,
//         details: process.env.NODE_ENV === 'development' ? error.message : undefined
//       },
//       { status: statusCode }
//     );
//   }
// }

// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const transaction_id = searchParams.get('transaction_id');
    
//     if (!transaction_id) {
//       return NextResponse.json(
//         { error: 'Transaction ID is required' },
//         { status: 400 }
//       );
//     }

//     const transaction = await payarcClient.getTransaction(transaction_id);
    
//     return NextResponse.json({
//       success: true,
//       ...transaction
//     });
//   } catch (error) {
//     console.error('Payment verification error:', error);
    
//     return NextResponse.json(
//       { 
//         success: false,
//         error: 'Failed to verify payment'
//       },
//       { status: 500 }
//     );
//   }
// }