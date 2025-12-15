// /app/api/payarc/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { payarcClient } from '@/utils/payarc-helper';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transaction_id') || 
                         searchParams.get('charge_id') || 
                         searchParams.get('payment_id');
    const status = searchParams.get('status');
    const reservationId = searchParams.get('reservationId') || 
                         searchParams.get('metadata[reservationId]');

    console.log('PayArc callback received:', {
      transactionId,
      status,
      reservationId,
      allParams: Object.fromEntries(searchParams.entries())
    });

    if (!transactionId) {
      console.error('No transaction ID in callback');
      return NextResponse.redirect(
        new URL(`/booking?error=no_transaction_id&${searchParams.toString()}`, request.url)
      );
    }

    // Verify the transaction with PayArc
    let transactionStatus = 'pending';
    let verifiedAmount = 0;
    
    try {
      const transaction = await payarcClient.verifyTransaction(transactionId);
      transactionStatus = transaction.status;
      verifiedAmount = transaction.amount;
      console.log('Transaction verified:', transaction);
    } catch (verifyError) {
      console.error('Transaction verification failed:', verifyError);
      // Continue with status from callback if verification fails
      transactionStatus = status || 'unknown';
    }

    // Prepare redirect URL with status information
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let redirectUrl: string;

    if (transactionStatus === 'approved') {
      // Success - redirect to confirmation page
      redirectUrl = `${baseUrl}/booking/confirmation?transaction=${transactionId}&reservation=${reservationId || 'unknown'}`;
      
      // Here you would typically update your database
      // await updateReservationPayment(reservationId, 'paid', transactionId, verifiedAmount);
      
    } else if (transactionStatus === 'declined') {
      // Payment declined
      redirectUrl = `${baseUrl}/booking?error=payment_declined&transaction=${transactionId}`;
    } else {
      // Pending or unknown status
      redirectUrl = `${baseUrl}/booking?status=${transactionStatus}&transaction=${transactionId}`;
    }

    console.log('Redirecting to:', redirectUrl);
    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    console.error('Callback processing error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${baseUrl}/booking?error=callback_processing&message=${encodeURIComponent(error.message)}`
    );
  }
}

// Also handle POST callbacks for webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('PayArc webhook received:', body);
    
    // Handle webhook events (charge.succeeded, charge.failed, etc.)
    // Update your database accordingly
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}