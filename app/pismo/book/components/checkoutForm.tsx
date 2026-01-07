'use client';

import { useState } from 'react';
import PaymentFields from './paymentFields';

export default function CheckoutForm({ 
  total, 
  isExpanded, 
  setIsExpanded, 
  onPayment, 
  message, 
  loading,
  isEditing = false,
  selectedItems = [],
  goggles = 0,
  bandannas = 0
}: any) {
  const [agreed, setAgreed] = useState(false);
  const [payNow, setPayNow] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleConfirm = () => {
    setCardError(null);

    if (payNow) {
        // Try to trigger tokenization
        if (window.CollectJS) {
            console.log("Starting Tokenization...");
            try {
                window.CollectJS.createToken((response: any) => {
                    // Success is handled by PaymentFields.tsx callback
                    // Errors are handled here
                    if (response && response.error) {
                        setCardError(response.error);
                    }
                });
            } catch (err) {
                console.error("Tokenization Crash:", err);
                setCardError("Payment system error. Please refresh the page.");
            }
        } else {
            setCardError("Payment fields haven't loaded yet. Please wait a moment.");
        }
    } else {
        onPayment(null); 
    }
  };

  const handleTokenGenerated = (token: string) => {
      onPayment(token); 
  };

  const handleCardError = (err: string) => {
      setCardError(err);
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[100] transition-all duration-300 ${
      isExpanded ? 'bg-gray-900 h-[80vh] rounded-t-3xl shadow-2xl border-t border-gray-700' : 'bg-orange-600 h-20 cursor-pointer'
    }`}>
      
      {!isExpanded ? (
        <div onClick={() => setIsExpanded(true)} className="flex justify-between items-center p-5 h-full">
          <span className="text-xl font-bold">Total: ${total.toFixed(2)}</span>
          <span className="animate-pulse font-bold uppercase tracking-widest">
            {isEditing ? 'Review & Update →' : 'Review & Book →'}
          </span>
        </div>
      ) : (
        // STICKY HEADER LAYOUT
        <div className="flex flex-col h-full max-w-2xl mx-auto">
          
          {/* 1. Header */}
          <div className="flex-shrink-0 px-6 py-5 md:px-8 border-b border-gray-800 bg-gray-900 rounded-t-3xl flex justify-between items-center z-50">
            <button 
              onClick={() => setIsExpanded(false)} 
              className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1"
            >
              <span>←</span> Back
            </button>
            <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Update Reservation' : 'Confirm Reservation'}
            </h2>
          </div>
          
          {/* 2. Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar pb-32">
            
             <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-gray-700 shadow-lg">
               <div className="text-center mb-6 border-b border-gray-700 pb-6">
                  <div className="text-4xl font-bold text-white mb-2">${total.toFixed(2)}</div>
                  <div className="text-gray-400 text-sm uppercase tracking-wide">Total Due</div>
               </div>

               <div className="space-y-3 text-sm">
                  <h3 className="font-bold text-gray-400 uppercase text-xs mb-3">Order Summary</h3>
                  {selectedItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-white font-medium">
                      <span>{item.qty}x {item.name} {item.waiver ? '(+Waiver)' : ''}</span>
                      <span>${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                  {goggles > 0 && <div className="flex justify-between text-gray-300"><span>{goggles}x Goggles</span><span>${(goggles * 4).toFixed(2)}</span></div>}
                  {bandannas > 0 && <div className="flex justify-between text-gray-300"><span>{bandannas}x Bandannas</span><span>${(bandannas * 5).toFixed(2)}</span></div>}
               </div>
            </div>

            {!isEditing && (
              <div className="mb-8">
                  <label className="flex items-center gap-3 bg-gray-800 p-4 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-750 transition-colors">
                      <input 
                          type="checkbox" 
                          checked={payNow} 
                          onChange={e => setPayNow(e.target.checked)} 
                          className="w-5 h-5 accent-orange-500 cursor-pointer"
                      />
                      <div>
                          <span className="block font-bold text-white">Pay with Card Now</span>
                          <span className="text-xs text-gray-400">Process payment immediately via NMI</span>
                      </div>
                  </label>
              </div>
            )}

            {payNow && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <PaymentFields 
                    onTokenGenerated={handleTokenGenerated} 
                    onError={handleCardError} 
                  />
                </div>
            )}

            <label className="flex gap-4 items-start bg-red-950/30 p-4 rounded-xl mb-8 cursor-pointer border border-red-800/50 hover:bg-red-900/40 transition-colors">
              <input 
                type="checkbox" 
                checked={agreed} 
                onChange={e => setAgreed(e.target.checked)} 
                className="w-6 h-6 mt-1 accent-orange-500 cursor-pointer shrink-0" 
              />
              <span className="text-sm text-gray-200 font-medium leading-relaxed">
                  I agree to the liability waiver and assume full responsibility for any equipment damages.
              </span>
            </label>

            {(message || cardError) && (
              <div className={`text-center font-bold p-4 rounded-lg mb-6 border animate-pulse ${
                (message?.includes('Confirmed') && !cardError)
                ? 'bg-green-900/40 text-green-400 border-green-800' 
                : 'bg-red-900/40 text-red-400 border-red-800'
              }`}>
                {cardError || message}
              </div>
            )}

            <button 
              type="button"
              onClick={handleConfirm} 
              disabled={loading || !agreed}
              className={`w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-5 rounded-2xl text-2xl font-bold shadow-lg transition-all active:scale-[0.98]`}
            >
              {loading ? 'Processing...' : (
                  agreed 
                   ? (isEditing ? 'Update Reservation' : (payNow ? `Pay $${total.toFixed(2)} & Book` : 'Confirm Booking')) 
                   : 'Agree to Continue'
              )}
            </button>
            
          </div>
        </div>
      )}
    </div>
  );
}