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
    let checkInterval: NodeJS.Timeout;

    // Defines the setup logic
    const setupNMI = () => {
        // 1. Check if the script exists
        if (!window.CollectJS) return false;

        // 2. CRITICAL: Check if the DIVs are actually in the DOM yet
        const ccDiv = document.getElementById('cc-number');
        if (!ccDiv) return false;

        // Prevent double-configuration
        if (configAttempted.current) return true;

        console.log("DOM Ready. Configuring NMI...");
        configAttempted.current = true;

        try {
            window.CollectJS.configure({
                // Force Inline Mode
                'variant': 'inline', 
                
                // Disable wallets to prevent "PaymentRequestAbstraction" crash
                // Note: If these cause "Unexpected Fields" again, remove them, 
                // but usually 'variant: inline' requires these to be false or omitted.
                // 'googlePay': false,
                // 'applePay': false,

                // Map Fields
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
                
                // Styling
                'styleSniffer': 'true',

                // Callback
                'callback': (response: any) => {
                    if (response.token) {
                        onTokenGenerated(response.token);
                    } else {
                        onError(response.error || "Check card details");
                    }
                }
            });
            
            // Verify if createToken appeared
            let attempts = 0;
            const verifyInterval = setInterval(() => {
                attempts++;
                if (typeof window.CollectJS.createToken === 'function') {
                    console.log("NMI Ready: createToken function found.");
                    setLoadingStatus(""); 
                    clearInterval(verifyInterval);
                } else if (attempts > 50) { 
                    console.error("NMI Configured but createToken missing.");
                    setLoadingStatus("Payment system error. Please refresh.");
                    clearInterval(verifyInterval);
                }
            }, 100);

            return true;

        } catch (e) {
            console.error("NMI Config Error:", e);
            setLoadingStatus("Error loading payment.");
            return false;
        }
    };

    // --- SCRIPT LOADING LOGIC ---

    // 1. Inject Script if missing
    if (!document.getElementById('nmi-collect-js')) {
        const script = document.createElement('script');
        script.id = 'nmi-collect-js';
        script.src = 'https://secure.nmi.com/token/Collect.js';
        script.setAttribute('data-tokenization-key', process.env.NEXT_PUBLIC_NMI_TOKENIZATION_KEY!);
        script.async = true;
        document.body.appendChild(script);
    }

    // 2. Start Polling Loop
    // We poll until both Script AND Divs are ready
    checkInterval = setInterval(() => {
        const success = setupNMI();
        if (success) {
            clearInterval(checkInterval);
        }
    }, 200);

    // Cleanup
    return () => {
        if (checkInterval) clearInterval(checkInterval);
        // We reset the ref so if the user closes/reopens the section, it re-mounts
        configAttempted.current = false;
    };

  }, [onTokenGenerated, onError]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 space-y-4 mb-6">
      <h3 className="font-bold text-orange-500 mb-2">Credit Card Details</h3>
      
      {loadingStatus && (
          <div className="bg-yellow-900/30 text-yellow-200 p-3 rounded text-sm text-center border border-yellow-800 animate-pulse">
            {loadingStatus}
          </div>
      )}

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