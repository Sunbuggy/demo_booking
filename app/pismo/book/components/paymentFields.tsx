'use client';

import { useEffect, useState, useRef } from 'react';
import { Lock } from 'lucide-react';

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
    // SEMANTIC: Card Container (bg-card, border-border)
    // Removed hardcoded bg-gray-800
    <div className="bg-card text-card-foreground p-6 rounded-lg border border-border space-y-4 mb-6 shadow-sm">
      <h3 className="font-bold text-primary mb-2">Credit Card Details</h3>
      
      {loadingStatus && (
          // SEMANTIC: Warning State (Destructive tint or secondary)
          // Using secondary here for a softer "Loading" state, or destructive for error
          <div className="bg-secondary text-secondary-foreground p-3 rounded text-sm text-center border border-border animate-pulse">
            {loadingStatus}
          </div>
      )}

      {/* Fields */}
      <div className="space-y-4">
        <div>
           {/* SEMANTIC: Label (Muted Foreground) */}
           <label className="block text-xs text-muted-foreground uppercase mb-1 font-semibold">Card Number</label>
           
           {/* SEMANTIC: Input Container 
               These divs host the NMI iframes. 
               We give them bg-background and border-input so they match standard inputs.
           */}
           <div id="cc-number" className="bg-background border border-input rounded h-12 w-full relative focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-xs text-muted-foreground uppercase mb-1 font-semibold">Expiry (MM/YY)</label>
               <div id="cc-exp" className="bg-background border border-input rounded h-12 w-full relative focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all"></div>
            </div>
            <div>
               <label className="block text-xs text-muted-foreground uppercase mb-1 font-semibold">CVV</label>
               <div id="cc-cvc" className="bg-background border border-input rounded h-12 w-full relative focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all"></div>
            </div>
        </div>
      </div>
      
      {/* SEMANTIC: Footer Text */}
      <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" /> Payments secured by NMI
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