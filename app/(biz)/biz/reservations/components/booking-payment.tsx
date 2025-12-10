'use client';
import React, { useState, useEffect, useRef } from 'react';

const BookingPay = ({
  formToken,
  setResponse
}: {
  formToken: string;
  setResponse: (response: string) => void;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [iframeHeight, setIframeHeight] = useState('600px');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeSrc, setIframeSrc] = useState('');

  // Set the iframe source when formToken is available
  useEffect(() => {
    if (formToken) {
      // For Authorize.net Accept Hosted, the iframe URL is:
      // https://accept.authorize.net/payment/payment?formToken={formToken}
      setIframeSrc(`https://accept.authorize.net/payment/payment?formToken=${formToken}`);
      console.log('Setting iframe src with formToken:', formToken.substring(0, 50) + '...');
    }
  }, [formToken]);

  // Listen for postMessage events from the iframe (if Authorize.net supports it)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message from iframe:', event.data);
      
      // Handle messages from Authorize.net iframe
      if (event.data && typeof event.data === 'object') {
        if (event.data.messageType === 'PAYMENT_FORM_LOADED') {
          console.log('Payment form loaded successfully');
        } else if (event.data.messageType === 'TRANSACTION_COMPLETE') {
          console.log('Transaction complete:', event.data);
          setResponse(JSON.stringify(event.data, null, 2) + '\n');
          
          if (event.data.transactionResponse?.responseCode === '1') {
            alert('Payment successful! Thank you for your booking.');
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setResponse]);

  const handleIframeLoad = () => {
    console.log('Iframe loaded');
    setIsProcessing(false);
    
    // Try to scroll to the iframe
    setTimeout(() => {
      iframeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
  };

  const handleIframeError = () => {
    console.error('Iframe failed to load');
    setIsProcessing(false);
    alert('Failed to load payment form. Please try again or contact support.');
  };

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Secure payment processed by Authorize.net
        </p>
        <p className="text-xs text-gray-500 mb-2">
          Please complete all payment details in the form below. You may need to scroll within the payment box.
        </p>
        {isProcessing && (
          <div className="text-blue-600 mb-2">
            Loading payment form...
          </div>
        )}
      </div>
      
      {/* Direct iframe implementation */}
      <div className="relative border rounded-lg overflow-hidden bg-gray-50">
        {iframeSrc ? (
          <>
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              title="Authorize.net Payment Form"
              className="w-full"
              style={{ 
                height: iframeHeight,
                minHeight: '500px',
                border: 'none',
                backgroundColor: 'white'
              }}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-modals"
              allow="payment *"
              scrolling="auto"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white to-transparent h-12 flex items-center justify-center">
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                Scroll within this box to see all payment fields
              </span>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment form...</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default BookingPay;