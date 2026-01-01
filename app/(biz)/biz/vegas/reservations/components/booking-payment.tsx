// 'use client';
// import React, { useState } from 'react';
// import { AcceptHosted } from 'react-acceptjs';

// const BookingPay = ({
//   formToken,
//   setResponse
// }: {
//   formToken: string;
//   setResponse: (response: string) => void;
// }) => {
//   const [isProcessing, setIsProcessing] = useState(false);

//   const handleTransactionResponse = (response: any) => {
//     setIsProcessing(false);
//     const responseString = JSON.stringify(response, null, 2) + '\n';
//     setResponse(responseString);
    
//     if (response.messages?.resultCode === 'Ok') {
//       console.log('Payment successful:', response);
//       // You can add more logic here, like redirecting to success page
//     } else {
//       console.log('Payment failed:', response);
//     }
//   };

//   return (
//     <div className="w-full">
//       <AcceptHosted
//         formToken={formToken}
//         integration="iframe"
//         onTransactionResponse={handleTransactionResponse}
//         onCancel={() => {
//           setIsProcessing(false);
//           setResponse('Payment cancelled by user.\n');
//         }}
//         onSuccessfulSave={() => {
//           setIsProcessing(false);
//           setResponse('Payment method saved successfully!\n');
//         }}
//         onResize={(w, h) =>
//           setResponse(`Payment form resized to ${w} x ${h}.\n`)
//         }
//       >
//         <div className="text-center mb-4">
//           <p className="text-sm text-gray-600 mb-2">
//             Secure payment processed by Authorize.net
//           </p>
//           {isProcessing && (
//             <div className="text-blue-600 mb-2">
//               Processing payment...
//             </div>
//           )}
//         </div>
//         <div onClick={() => setIsProcessing(true)}>
//           <AcceptHosted.Button 
//             className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 bg-blue-600 text-white hover:bg-blue-700 h-12 px-6 py-3 mb-4 w-full text-lg"
//           >
//             🔒 Complete Payment (${formToken ? 'Ready' : 'Loading...'})
//           </AcceptHosted.Button>
//         </div>
//         <AcceptHosted.IFrame className="w-full h-[500px] border rounded-lg overflow-auto" />
//       </AcceptHosted>
//     </div>
//   );
// };

// export default BookingPay;
'use client';
import React from 'react';

interface BookingPayProps {
  reservationId: number;
  totalPrice: number;
  firstName: string;
  lastName: string;
}

const BookingPay: React.FC<BookingPayProps> = ({ 
  reservationId, 
  totalPrice, 
  firstName, 
  lastName 
}) => {
  // Generate payment URL
  const generatePaymentUrl = () => {
    const timestamp = Date.now();
    return `https://oceanoatvrentals.com/lib/oauthorizetestP.php?invoiceNumber=${reservationId}&cacke=${timestamp}&qost=${totalPrice}&fname=${encodeURIComponent(firstName)}&lname=${encodeURIComponent(lastName)}`;
  };

  const paymentUrl = generatePaymentUrl();

  return (
    <div className="w-full">
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          <span className="font-bold">Important:</span> Please wait for the <span className="font-bold">"Thank you for your payment"</span> message 
          after pressing Pay to make sure it went through.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          Reservation ID: <span className="font-bold">#{reservationId}</span> | 
          Amount: <span className="font-bold">${totalPrice.toFixed(2)}</span>
        </p>
      </div>
      
      <iframe 
        name="ccwin"
        id="ccwin"
        src={paymentUrl}
        title="Payment Gateway"
        className="w-full border rounded"
        style={{ height: '500px' }}
      />
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>Secure payment processed by Authorize.net</p>
        <p className="mt-2">
          <button 
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Refresh after payment
          </button>
        </p>
      </div>
    </div>
  );
};

export default BookingPay;