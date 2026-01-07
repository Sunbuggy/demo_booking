'use client';

import { useEffect, useState, useRef } from 'react';

declare global {
  interface Window {
    CollectJS: any;
  }
}

export default function PaymentFields({ onTokenGenerated, onError }: { onTokenGenerated: (t: string) => void, onError: (e: string) => void }) {
  const [loadingStatus, setLoadingStatus] = useState("Loading secure fields...");
  const configAttempted = useRef(false);

  useEffect(() => {
    const setupNMI = () => {
        if (!window.CollectJS) return;
        if (configAttempted.current) return;
        
        // Ensure the hidden button exists before configuring
        if (!document.getElementById('nmi-hidden-btn')) return;

        console.log("Configuring NMI (Button Mode)...");
        configAttempted.current = true;

        try {
            window.CollectJS.configure({
                // 1. "Inline" mode for custom divs
                'variant': 'inline', 
                
                // 2. Attach to a hidden button instead of using createToken()
                // This bypasses the initialization crash you were seeing.
                'paymentSelector': '#nmi-hidden-btn',

                // 3. Map Fields
                'fields': {
                    'ccnumber': {
                        'selector': '#cc-number',
                        'placeholder': '0000 0000 0000 0000'
                    },
                    'ccexp': {
                        'selector': '#cc-exp',
                        'placeholder': 'MM / YY'
                    },
                    'cvv': {
                        'selector': '#cc-cvc',
                        'placeholder': '123'
                    }
                },
                
                // 4. Callbacks
                'callback': (response: any) => {
                    // This runs when the hidden button is clicked and NMI finishes
                    if (response.token) {
                        onTokenGenerated(response.token);
                    } else {
                        console.error("NMI Error:", response);
                        onError(response.error || "Check card details");
                    }
                }
            });
            
            // Just clear the loading text, we assume it works if no immediate crash
            setLoadingStatus(""); 
            console.log("NMI Ready (Button Attached)");

        } catch (e) {
            console.error("NMI Config Crash:", e);
            setLoadingStatus("Error loading payment.");
        }
    };

    // Script Loading
    if (document.getElementById('nmi-collect-js')) {
        if (window.CollectJS) setTimeout(setupNMI, 500);
        return;
    }

    const script = document.createElement('script');
    script.id = 'nmi-collect-js';
    script.src = 'https://secure.nmi.com/token/Collect.js';
    script.setAttribute('data-tokenization-key', process.env.NEXT_PUBLIC_NMI_TOKENIZATION_KEY!);
    script.async = true;
    script.onload = () => {
        setTimeout(setupNMI, 500);
    };
    document.body.appendChild(script);

  }, [onTokenGenerated, onError]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 space-y-4 mb-6">
      <h3 className="font-bold text-orange-500 mb-2">Credit Card Details</h3>
      
      {loadingStatus && (
          <div className="bg-yellow-900/30 text-yellow-200 p-3 rounded text-sm text-center border border-yellow-800 animate-pulse">
            {loadingStatus}
          </div>
      )}

      {/* Fields */}
      <div className="space-y-4">
        <div>
           <label className="block text-xs text-gray-400 uppercase mb-1">Card Number</label>
           <div id="cc-number" className="bg-gray-900 border border-gray-700 rounded h-12 w-full relative"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-xs text-gray-400 uppercase mb-1">Expiry (MM/YY)</label>
               <div id="cc-exp" className="bg-gray-900 border border-gray-700 rounded h-12 w-full relative"></div>
            </div>
            <div>
               <label className="block text-xs text-gray-400 uppercase mb-1">CVV</label>
               <div id="cc-cvc" className="bg-gray-900 border border-gray-700 rounded h-12 w-full relative"></div>
            </div>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
        🔒 Payments secured by NMI
      </p>

      {/* --- THE HIDDEN TRIGGER BUTTON --- */}
      {/* We click this programmatically from CheckoutForm */}
      <button 
        id="nmi-hidden-btn" 
        type="button" 
        style={{ display: 'none' }}
      >
        Submit to NMI
      </button>
    </div>
  );
}