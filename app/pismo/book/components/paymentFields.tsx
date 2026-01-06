'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    CollectJS: any;
  }
}

export default function PaymentFields({ onTokenGenerated, onError }: { onTokenGenerated: (t: string) => void, onError: (e: string) => void }) {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // 1. Load NMI Collect.js Script
    if (document.getElementById('nmi-collect-js')) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'nmi-collect-js';
    script.src = 'https://secure.nmi.com/token/Collect.js';
    script.setAttribute('data-tokenization-key', process.env.NEXT_PUBLIC_NMI_TOKENIZATION_KEY!);
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
      // Configure NMI styles/callbacks
      if (window.CollectJS) {
        window.CollectJS.configure({
            'primaryColor': '#f97316', // Orange-500
            'secondaryColor': '#FFFFFF',
            'elementFontFamily': 'sans-serif',
            'placeholderColor': '#9CA3AF', // Gray-400
            'callback': (response: any) => {
                if (response.token) {
                    onTokenGenerated(response.token);
                } else {
                    onError("Card Error: " + (response.error || "Invalid details"));
                }
            }
        });
      }
    };
    document.body.appendChild(script);
  }, [onTokenGenerated, onError]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 space-y-4 mb-6">
      <h3 className="font-bold text-orange-500 mb-2">Credit Card Details</h3>
      {!scriptLoaded && <p className="text-gray-400 text-sm">Loading secure payment fields...</p>}
      
      {/* NMI looks for specific fields, or we use their inline fields if configured differently. 
          Standard Collect.js usually attaches to inputs you define. */}
      <div className="space-y-4">
        <div>
           <label className="block text-xs text-gray-400 uppercase mb-1">Card Number</label>
           {/* Collect.js will intercept this field */}
           <div id="cc-number" className="bg-gray-900 border border-gray-700 rounded p-3 h-12 w-full"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-xs text-gray-400 uppercase mb-1">Expiry (MM/YY)</label>
               <div id="cc-exp" className="bg-gray-900 border border-gray-700 rounded p-3 h-12 w-full"></div>
            </div>
            <div>
               <label className="block text-xs text-gray-400 uppercase mb-1">CVV</label>
               <div id="cc-cvc" className="bg-gray-900 border border-gray-700 rounded p-3 h-12 w-full"></div>
            </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
        🔒 Payments secured by NMI
      </p>
    </div>
  );
}