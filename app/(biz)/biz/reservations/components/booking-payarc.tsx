'use client';

import { useEffect, useRef, useState } from 'react';
import { createTransaction, captureTransaction, NMI } from 'elevated-pay';
import { NmiIframe } from 'nmi-react-sdk';

interface BookingPayProps {
  reservationId: number;
  totalPrice: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
}

export default function BookingPay({
  reservationId,
  totalPrice,
  firstName,
  lastName,
  email = '',
  phone = '',
  address = ''
}: BookingPayProps) {
  const [paymentToken, setPaymentToken] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize NMI with your credentials
  const nmiConfig = {
    apiKey: process.env.NEXT_PUBLIC_NMI_API_KEY || '',
    redirectUrl: `${window.location.origin}/payment/callback`,
    cancelUrl: `${window.location.origin}/payment/cancel`,
  };

  // Generate payment token
  const generatePaymentToken = async () => {
    setIsProcessing(true);
    try {
      // Create transaction with NMI
      const transactionData = {
        amount: totalPrice,
        currency: 'USD',
        order_id: `RES-${reservationId}`,
        customer_reference: `CUST-${reservationId}`,
        billing: {
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          address: address || 'Not provided',
        },
        metadata: {
          reservation_id: reservationId.toString(),
          booking_type: 'vehicle_rental'
        }
      };

      // For development, use sandbox mode
      const nmi = new NMI(nmiConfig.apiKey, {
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
      });

      const response = await nmi.createTransaction(transactionData);
      
      if (response.success && response.token) {
        setPaymentToken(response.token);
      } else {
        throw new Error('Failed to generate payment token');
      }
    } catch (error) {
      console.error('Error generating payment token:', error);
      setPaymentStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payment completion
  const handlePaymentComplete = async (event: MessageEvent) => {
    if (event.origin !== 'https://secure.nmi.com') return;
    
    try {
      const paymentData = JSON.parse(event.data);
      
      if (paymentData.success) {
        // Payment was successful
        setPaymentStatus('success');
        
        // Update reservation status in your database
        await updateReservationPayment(reservationId, {
          transaction_id: paymentData.transaction_id,
          payment_status: 'completed',
          payment_method: 'credit_card',
          payment_amount: totalPrice
        });
        
        // Redirect or show success message
        window.location.href = `/booking/confirmation/${reservationId}`;
      } else {
        // Payment failed
        setPaymentStatus('error');
        console.error('Payment failed:', paymentData.error);
      }
    } catch (error) {
      console.error('Error processing payment response:', error);
      setPaymentStatus('error');
    }
  };

  // Update reservation with payment info
  const updateReservationPayment = async (
    resId: number, 
    paymentData: {
      transaction_id: string;
      payment_status: string;
      payment_method: string;
      payment_amount: number;
    }
  ) => {
    try {
      const response = await fetch('/api/reservations/update-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservation_id: resId,
          ...paymentData
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update reservation');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating reservation:', error);
    }
  };

  // Listen for payment completion messages
  useEffect(() => {
    window.addEventListener('message', handlePaymentComplete);
    
    return () => {
      window.removeEventListener('message', handlePaymentComplete);
    };
  }, []);

  // Generate payment token on component mount
  useEffect(() => {
    if (reservationId && totalPrice > 0) {
      generatePaymentToken();
    }
  }, [reservationId, totalPrice]);

  return (
    <div className="w-full">
      {isProcessing && !paymentToken ? (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Setting up secure payment...</p>
        </div>
      ) : paymentStatus === 'error' ? (
        <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
          <h3 className="text-red-700 font-bold mb-2">Payment Error</h3>
          <p className="text-red-600 mb-4">There was an error setting up the payment. Please try again.</p>
          <button
            onClick={generatePaymentToken}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry Payment Setup
          </button>
        </div>
      ) : paymentToken ? (
        <div className="w-full">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-700">
              <strong>Secure Payment Portal</strong> - Complete your payment using the secure form below.
            </p>
          </div>
          
          {/* NMI Payment Iframe */}
          <div className="border rounded-lg overflow-hidden">
            {process.env.NODE_ENV === 'development' ? (
              // Development mode - show mock iframe
              <div className="h-[600px] bg-gray-100 flex flex-col items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4 text-center">Mock Payment Form</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="4111 1111 1111 1111"
                        defaultValue="4111111111111111"
                      />
                    </div>
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          placeholder="MM/YY"
                          defaultValue="12/25"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          placeholder="123"
                          defaultValue="123"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setPaymentStatus('success')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded mt-4"
                    >
                      Pay ${totalPrice.toFixed(2)}
                    </button>
                    <button
                      onClick={() => setPaymentStatus('error')}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded"
                    >
                      Simulate Payment Error
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Production mode - actual NMI iframe
              <NmiIframe
                token={paymentToken}
                style={{ width: '100%', height: '600px', border: 'none' }}
                onLoad={() => console.log('NMI iframe loaded')}
                onError={(error) => {
                  console.error('NMI iframe error:', error);
                  setPaymentStatus('error');
                }}
              />
            )}
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Your payment is processed securely by Elevated Pay / NMI</p>
            <div className="flex items-center justify-center mt-2 space-x-4">
              <span>🔒 SSL Secured</span>
              <span>|</span>
              <span>PCI Compliant</span>
              <span>|</span>
              <span>256-bit Encryption</span>
            </div>
          </div>
        </div>
      ) : null}
      
      {paymentStatus === 'success' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md mx-4">
            <div className="text-center">
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <h3 className="text-2xl font-bold mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-6">
                Thank you for your payment. Your reservation is now confirmed.
              </p>
              <button
                onClick={() => window.location.href = `/booking/confirmation/${reservationId}`}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded w-full"
              >
                View Booking Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}