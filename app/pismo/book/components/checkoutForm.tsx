'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    CollectJS: any;
  }
}

export default function CheckoutForm({ 
  total, 
  isExpanded, 
  setIsExpanded, 
  onPayment, 
  message, 
  loading, 
}: any) {
  const [agreed, setAgreed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // Guard to prevent double configuration
  const initializationAttempted = useRef(false);

  // === 1. The Configuration Function ===
  const configurePayment = useCallback(() => {
    if (!window.CollectJS) return;
    if (initializationAttempted.current) return;

    // Check if the HTML elements exist
    const fieldElement = document.getElementById('cc-number');
    if (!fieldElement) {
      setTimeout(configurePayment, 200);
      return;
    }

    try {
      console.log("Initializing NMI with Validation Data...");

      // FIX: We must provide price/currency/country to satisfy NMI's internal 
      // "PaymentRequestAbstraction" checks, even if we don't use Apple Pay.
      const config = {
        variant: 'inline',
        // Common Required Fields for successful init
        price: total.toFixed(2),
        currency: 'USD',
        country: 'US',
        
        fields: {
          ccnumber: {
            selector: '#cc-number',
            placeholder: '0000 0000 0000 0000'
          },
          ccexp: {
            selector: '#cc-exp',
            placeholder: 'MM / YY'
          },
          cvv: {
            selector: '#cc-cvv',
            placeholder: '123'
          }
        },
        // The callback handles the response from tokenise()
        callback: (response: { token?: string; error?: string }) => {
          console.log("Payment Callback:", response);
          if (response.token) {
            onPayment(response.token);
          } else {
            // Log raw error for debugging
            console.error("NMI Validation Error:", response);
            alert("Payment Error: " + (response.error || "Please check card details."));
          }
        }
      };

      window.CollectJS.configure(config);
      
      initializationAttempted.current = true;
      setIsReady(true);
      console.log("NMI Ready & Configured");

    } catch (err) {
      console.error("NMI Configuration Crash:", err);
    }
  }, [total, onPayment]);

  // === 2. Script Loader ===
  useEffect(() => {
    // Reset state when form closes
    if (!isExpanded) {
      initializationAttempted.current = false;
      setIsReady(false);
      return;
    }

    const tokenKey = process.env.NEXT_PUBLIC_NMI_TOKENIZATION_KEY;
    if (!tokenKey) {
       console.error("Missing NMI Key");
       return;
    }

    const loadScript = () => {
       if (window.CollectJS) {
          // If script exists, just configure
          configurePayment();
       } else {
          // Load fresh script
          const script = document.createElement('script');
          script.src = "https://secure.networkmerchants.com/token/Collect.js";
          script.setAttribute('data-tokenization-key', tokenKey);
          script.async = true;
          script.onload = () => setTimeout(configurePayment, 500);
          document.body.appendChild(script);
       }
    };

    // Small delay to ensure DOM is rendered before script logic runs
    setTimeout(loadScript, 300);

  }, [isExpanded, configurePayment]);

  // === 3. Pay Button Handler ===
  const handleSubmit = () => {
    if (!window.CollectJS || !isReady) {
      console.error("Payment system not ready");
      return;
    }

    console.log("Submitting Token Request...");

    // FIX: Try both spellings just in case, though tokenise is standard.
    if (typeof window.CollectJS.tokenise === 'function') {
      window.CollectJS.tokenise();
    } else if (typeof window.CollectJS.tokenize === 'function') {
      window.CollectJS.tokenize();
    } else {
      console.error("Critical: tokenise function missing. Config likely failed.");
      alert("Payment system failed to load. Please refresh.");
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[100] transition-all duration-300 ${
      isExpanded ? 'bg-gray-900 h-[90vh] rounded-t-3xl shadow-2xl border-t border-gray-700' : 'bg-orange-600 h-20 cursor-pointer'
    }`}>
      
      {!isExpanded ? (
        <div onClick={() => setIsExpanded(true)} className="flex justify-between items-center p-5 h-full">
          <span className="text-xl font-bold">Total: ${total.toFixed(2)}</span>
          <span className="animate-pulse font-bold uppercase tracking-widest">Review & Pay →</span>
        </div>
      ) : (
        <div className="p-6 md:p-8 overflow-y-auto h-full max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setIsExpanded(false)} className="text-orange-400 hover:text-orange-300">← Back</button>
            <h2 className="text-xl font-bold text-white">Secure Payment</h2>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-xl mb-6 border border-gray-700">
             <div className="flex justify-between font-bold text-lg text-white">
              <span>Total Amount:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <label className="flex gap-4 items-start bg-red-950/30 p-4 rounded-xl mb-8 cursor-pointer border border-red-800/50">
            <input 
              type="checkbox" 
              checked={agreed} 
              onChange={e => setAgreed(e.target.checked)} 
              className="w-6 h-6 mt-1 accent-orange-500" 
            />
            <span className="text-sm text-gray-200 font-medium">
                I agree to the liability waiver and assume responsibility for equipment damages.
            </span>
          </label>

          {/* Form Container */}
          <div className={`space-y-6 pb-24 transition-all duration-500 ${agreed ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale'}`}>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Card Number</label>
                <div id="cc-number" className="p-4 bg-gray-100 rounded-lg h-14 w-full text-black shadow-inner" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Expiration</label>
                  <div id="cc-exp" className="p-4 bg-gray-100 rounded-lg h-14 w-full text-black shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase ml-1">CVV</label>
                  <div id="cc-cvv" className="p-4 bg-gray-100 rounded-lg h-14 w-full text-black shadow-inner" />
                </div>
              </div>

              {message && (
                <div className={`text-center font-bold p-4 rounded-lg border ${
                  message.includes('Confirmed') 
                  ? 'bg-green-900/40 text-green-400 border-green-800' 
                  : 'bg-red-900/40 text-red-400 border-red-800'
                }`}>
                  {message}
                </div>
              )}

              <button 
                type="button"
                onClick={handleSubmit} 
                disabled={loading || !isReady || !agreed}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 text-white py-5 rounded-2xl text-2xl font-bold shadow-lg transition-all active:scale-95"
              >
                {loading ? 'Processing...' : `Pay $${total.toFixed(2)} Now`}
              </button>
          </div>
        </div>
      )}
    </div>
  );
}