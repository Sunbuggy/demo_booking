'use client';
import React, { Dispatch, SetStateAction } from 'react';
import { AcceptHosted } from 'react-acceptjs';

const AcceptHostedPage = ({
  formToken,
  setResponse
}: {
  formToken: string;
  setResponse: Dispatch<SetStateAction<string>>;
}) => {
  const handleTransactionResponse = (response: any) => {
    const responseString = JSON.stringify(response, null, 2) + '\n';
    setResponse(responseString);
    
    // You can add more specific response handling here
    if (response.messages?.resultCode === 'Ok') {
      // Payment was successful
      console.log('Payment successful:', response);
    } else {
      // Payment failed
      console.log('Payment failed:', response);
    }
  };

  return (
    <div>
      <AcceptHosted
        formToken={formToken}
        integration="iframe"
        onTransactionResponse={handleTransactionResponse}
        onCancel={() => setResponse((prevState) => prevState + 'Cancelled!\n')}
        onSuccessfulSave={() =>
          setResponse((prevState) => prevState + 'Successful save!\n')
        }
        onResize={(w, h) =>
          setResponse(
            (prevState) =>
              prevState + `Received resize message to ${w} x ${h}!\n`
          )
        }
      >
        <AcceptHosted.Button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2 mb-5 w-full">
          🔒 Complete Payment
        </AcceptHosted.Button>
        <AcceptHosted.IFrame className="w-full h-[600px] overflow-auto" />
      </AcceptHosted>
    </div>
  );
};

export default AcceptHostedPage;