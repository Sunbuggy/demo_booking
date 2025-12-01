'use client';
import React, { Dispatch, SetStateAction } from 'react';
import { AcceptHosted } from 'react-acceptjs';

const BookingPay = ({
  formToken,
  setResponse
}: {
  formToken: string;
  setResponse: (response: string) => void;
}) => {
  const handleTransactionResponse = (response: any) => {
    const responseString = JSON.stringify(response, null, 2) + '\n';
    setResponse(responseString);
    
    // You can add more specific response handling here
    if (response.messages?.resultCode === 'Ok') {
      // Payment was successful
      console.log('Payment successful:', response);
      alert('Payment successful! Thank you for your booking.');
    } else {
      // Payment failed
      console.log('Payment failed:', response);
      alert('Payment failed. Please try again or contact support.');
    }
  };

  return (
    <div className="w-full">
      <AcceptHosted
        formToken={formToken}
        integration="iframe"
        onTransactionResponse={handleTransactionResponse}
        onCancel={() => {
          setResponse('Payment cancelled by user.\n');
          alert('Payment was cancelled.');
        }}
        onSuccessfulSave={() =>
          setResponse('Payment method saved successfully!\n')
        }
        onResize={(w, h) =>
          setResponse(`Payment form resized to ${w} x ${h}.\n`)
        }
      >
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Secure payment processed by Authorize.net
          </p>
        </div>
        <AcceptHosted.Button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 bg-blue-600 text-white hover:bg-blue-700 h-12 px-6 py-3 mb-4 w-full text-lg">
          🔒 Complete Payment
        </AcceptHosted.Button>
        <AcceptHosted.IFrame className="w-full h-[500px] border rounded-lg overflow-auto" />
      </AcceptHosted>
    </div>
  );
};

export default BookingPay;