'use client';

import { useEffect, useState, useRef } from 'react';

declare global {
  interface Window {
    CollectJS: any;
  }
}

export default function PaymentFields({ onTokenGenerated, onError }: { onTokenGenerated: (t: string) => void, onError: (e: string) => void }) {
  const [loadingStatus, setLoadingStatus] = useState("Initializing secure payment...");
  const configAttempted = useRef(false);

  useEffect(() => {
    // Defines the setup logic
    const setupNMI = () => {
        if (!window.CollectJS) return;
        if (configAttempted.current) return; 

        console.log("Configuring NMI...");
        configAttempted.current = true;

        try {
            window.CollectJS.configure({
                // CRITICAL: Tells NMI we are using custom DIVs
                'variant': 'inline', 
                
                // REMOVED: googlePay/applePay to prevent "Unexpected fields" error
                
                // Map your DIV IDs
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
                
                // Style Sniffer helps NMI match your font color/size
                'styleSniffer': 'true',

                // The callback that runs when a token is created
                'callback': (response: any) => {
                    if (response.token) {
                        onTokenGenerated(response.token);
                    } else {
                        onError(response.error || "Check card details");
                    }
                }
            });
            
            // Wait for NMI to finish rendering the iframes
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                // We check if createToken is available
                if (typeof window.CollectJS.createToken === 'function') {
                    console.log("NMI Ready.");
                    setLoadingStatus(""); 
                    clearInterval(checkInterval);
                } else if (attempts > 50) { // Wait up to 10 seconds
                    console.error("NMI Timeout");
                    // Even if timeout, sometimes it works, so we just clear message
                    setLoadingStatus(""); 
                    clearInterval(checkInterval);
                }
            }, 200);

        } catch (e) {
            console.error("NMI Config Error:", e);
            setLoadingStatus("Error loading payment.");
        }
    };

    // --- SCRIPT LOADING LOGIC ---

    // 1. If script is already loaded globally, just configure
    if (window.CollectJS) {
        setupNMI();
        return;
    }

    // 2. If script tag exists but not ready, wait for it
    if (document.getElementById('nmi-collect-js')) {
        const interval = setInterval(() => {
            if (window.CollectJS) {
                clearInterval(interval);
                setupNMI();
            }
        }, 200);
        return;
    }

    // 3. Otherwise, inject script
    const script = document.createElement('script');
    script.id = 'nmi-collect-js';
    script.src = 'https://secure.nmi.com/token/Collect.js';
    script.setAttribute('data-tokenization-key', process.env.NEXT_PUBLIC_NMI_TOKENIZATION_KEY!);
    script.async = true;
    
    script.onload = () => {
        // Give the script a moment to parse
        setTimeout(setupNMI, 200);
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

      {/* IMPORTANT: These DIVs must exist before configure() runs. */}
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
    </div>
  );
}