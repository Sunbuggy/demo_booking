// /app/api/payarc/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { payarcClient } from '@/utils/payarc-helper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { amount, reservationId, customer } = body;
    
    if (!amount || !reservationId || !customer) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, reservationId, and customer are required' },
        { status: 400 }
      );
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    console.log('Creating PayArc payment for reservation:', reservationId, 'amount:', amountNum);

    // Method 1: Create charge with hosted page (recommended)
    try {
      const chargeData = {
        amount: amountNum,
        customer: {
          first_name: customer.firstName || 'Customer',
          last_name: customer.lastName || 'Guest',
          email: customer.email,
          phone: customer.phone || '',
        },
        metadata: {
          reservationId: reservationId,
          invoiceNumber: `INV-${reservationId}-${Date.now()}`,
          bookingDate: new Date().toISOString(),
        },
      };

      const charge = await payarcClient.createCharge(chargeData);

      // Return the hosted payment page URL
      return NextResponse.json({
        success: true,
        paymentUrl: charge.hosted_page?.url,
        chargeId: charge.id,
        transactionId: charge.transaction_id,
        expiresAt: charge.hosted_page?.expires_at,
      });

    } catch (chargeError: any) {
      console.error('Charge creation failed, trying hosted page:', chargeError.message);
      
      // Method 2: Fallback to hosted page
      try {
        const hostedPage = await payarcClient.createHostedPage({
          amount: amountNum,
          invoice_number: `INV-${reservationId}`,
          customer_email: customer.email,
          customer_first_name: customer.firstName,
          customer_last_name: customer.lastName,
          metadata: {
            reservationId: reservationId,
          },
        });

        return NextResponse.json({
          success: true,
          paymentUrl: hostedPage.url,
          pageId: hostedPage.page_id,
          method: 'hosted_page',
        });
      } catch (hostedError: any) {
        console.error('Hosted page creation also failed:', hostedError.message);
        throw new Error(`Both payment methods failed: ${chargeError.message}, ${hostedError.message}`);
      }
    }

  } catch (error: any) {
    console.error('PayArc API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create payment session',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}