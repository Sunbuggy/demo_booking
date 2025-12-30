'use client';

import { useState, useEffect, useCallback } from 'react';

export default function CheckoutForm({ 
  total, 
  isExpanded, 
  setIsExpanded, 
  onPayment, 
  message, 
  loading, 
  selectedItems 
}: any) {
  const [agreed, setAgreed] = useState(false);
  const [collectLoaded, setCollectLoaded] = useState(false);

  // Initialize NMI Collect.js
  useEffect(() => {
    // Only load the script if the drawer is expanded and we haven't loaded it yet
    if (!isExpanded || collectLoaded) return;

    const script = document.createElement('script');
    script.src = 'https://secure.networkmerchants.com/token/Collect.js';
    // Ensure this variable is in your .env.local file!
    script.setAttribute('data-tokenization-key', process.env.NEXT_PUBLIC_NMI_TOKENIZATION_KEY || '');
    script.async = true;

    script.onload = () => {
      if ((window as any).CollectJS) {
        (window as any).CollectJS.configure({
          variant: 'inline',
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
              placeholder: 'CVV' 
            },
          },
          // Custom styling for the iFrames to match your UI
          style: {
            'display': 'block',
            'width': '100%',
            'height': '24px',
            'color': '#ffffff',
            'font-size': '16px',
            'background-color': 'transparent',
            'border': 'none'
          },
          callback: (response: { token: string }) => {
            console.log("Token received:", response.token);
            onPayment(response.token);
          }
        });
        setCollectLoaded(true);
      }
    };

    document.body.appendChild(script);

    return () => {
      // Clean up script on unmount if needed
      if (document.body.contains(script)) {
        // document.body.removeChild(script); 
      }
    };
  }, [isExpanded, collectLoaded, onPayment]);

  const handlePayClick = () => {
    if (!agreed) return;
    if (!(window as any).CollectJS) {
      console.error("Collect.js not loaded yet");
      return;
    }
    // This triggers the NMI tokenization process
    (window as any).CollectJS.startPaymentRequest();
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
      isExpanded ? 'bg-gray-800 h-[85vh] rounded-t-3xl shadow-2xl' : 'bg-orange-600 h-20 cursor-pointer'
    }`}>
      
      {!isExpanded ? (
        <div onClick={() => setIsExpanded(true)} className="flex justify-between items-center p-5 h-full">
          <span className="text-xl font-bold">Total: ${total.toFixed(2)}</span>
          <span className="animate-pulse font-bold uppercase tracking-widest">Review & Pay →</span>
        </div>
      ) : (
        <div className="p-6 md:p-8 overflow-y-auto h-full max-w-2xl mx-auto">
          <button onClick={() => setIsExpanded(false)} className="text-orange-400 underline mb-6">← Edit Selection</button>
          
          <h2 className="text-2xl font-bold mb-4">Summary</h2>
          <div className="bg-gray-900/50 p-4 rounded-xl mb-6 space-y-2">
            {selectedItems.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.qty}x {item.name}</span>
                <span>${item.price.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between font-bold text-lg">
              <span>Total Due:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <label className="flex gap-4 items-start bg-red-950/20 p-4 rounded-xl mb-8 cursor-pointer border border-red-900">
            <input 
              type="checkbox" 
              checked={agreed} 
              onChange={e => setAgreed(e.target.checked)} 
              className="w-6 h-6 mt-1" 
            />
            <span className="text-sm">I agree to the liability waiver and assume responsibility for any damages to the equipment.</span>
          </label>

          {/* IMPORTANT: We keep these in the DOM but hide them visually until 'agreed' is true.
            This allows NMI's script to find and inject the iframes correctly.
          */}
          <div className={`space-y-4 pb-20 transition-opacity duration-300 ${agreed ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
            <div className="group">
              <label className="text-xs text-gray-400 mb-1 block">Card Number</label>
              <div id="cc-number" className="p-4 bg-gray-900 rounded-lg border border-gray-700 h-14 flex items-center" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Expiry (MM/YY)</label>
                <div id="cc-exp" className="p-4 bg-gray-900 rounded-lg border border-gray-700 h-14 flex items-center" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">CVV</label>
                <div id="cc-cvv" className="p-4 bg-gray-900 rounded-lg border border-gray-700 h-14 flex items-center" />
              </div>
            </div>

            {message && (
              <p className={`text-center font-bold p-3 rounded ${
                message.includes('Confirmed') ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
              }`}>
                {message}
              </p>
            )}

            <button 
              onClick={handlePayClick} 
              disabled={loading || !collectLoaded || !agreed}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 py-5 rounded-2xl text-2xl font-bold shadow-lg transition-all"
            >
              {loading ? 'Processing...' : `Pay $${total.toFixed(2)} & Book Now`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}