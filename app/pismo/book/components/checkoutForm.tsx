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
  const [payNow, setPayNow] = useState(false); // Checkbox state
  const [cardError, setCardError] = useState<string | null>(null);

  // Trigger the tokenization process
  const handleConfirm = () => {
    setCardError(null);

    if (payNow && window.CollectJS) {
        // 1. Trigger NMI Tokenization
        window.CollectJS.startPaymentRequest(); 
        // Note: The actual 'onPayment' will be called inside the callback in PaymentFields
        // But since PaymentFields is a child, we need a way to bubble it up.
        // A simpler way for Collect.js inline:
        // We configure the callback in PaymentFields to call a prop function 'onToken'.
    } else {
        // No payment or Pay Later -> Standard submit
        onPayment(null); // null token
    }
  };

  // Callback passed to PaymentFields
  const handleTokenGenerated = (token: string) => {
      // Token received! Now we submit the booking to backend
      onPayment(token);
  };

  const handleCardError = (err: string) => {
      setCardError(err);
      // Do not submit
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
        <div className="p-6 md:p-8 overflow-y-auto h-full max-w-2xl mx-auto custom-scrollbar pb-32">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setIsExpanded(false)} className="text-orange-400 hover:text-orange-300">← Back</button>
            <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Update Reservation' : 'Confirm Reservation'}
            </h2>
          </div>
          
          {/* Total Box */}
          <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-gray-700">
             <div className="text-center mb-6 border-b border-gray-700 pb-6">
                <div className="text-4xl font-bold text-white mb-2">${total.toFixed(2)}</div>
                <div className="text-gray-400 text-sm uppercase tracking-wide">Total Due</div>
             </div>

             {/* Order Summary */}
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

          {/* === PAYMENT TOGGLE === */}
          {!isEditing && (
            <div className="mb-8">
                <label className="flex items-center gap-3 bg-gray-800 p-4 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-750">
                    <input 
                        type="checkbox" 
                        checked={payNow} 
                        onChange={e => setPayNow(e.target.checked)} 
                        className="w-5 h-5 accent-orange-500"
                    />
                    <div>
                        <span className="block font-bold text-white">Pay with Card Now</span>
                        <span className="text-xs text-gray-400">Process payment immediately via NMI</span>
                    </div>
                </label>
            </div>
          )}

          {/* === PAYMENT FIELDS (Conditional) === */}
          {payNow && (
              <PaymentFields 
                onTokenGenerated={handleTokenGenerated} 
                onError={handleCardError} 
              />
          )}

          {/* Agreements */}
          <label className="flex gap-4 items-start bg-red-950/30 p-4 rounded-xl mb-8 cursor-pointer border border-red-800/50 hover:bg-red-900/40 transition-colors">
            <input 
              type="checkbox" 
              checked={agreed} 
              onChange={e => setAgreed(e.target.checked)} 
              className="w-6 h-6 mt-1 accent-orange-500 cursor-pointer" 
            />
            <span className="text-sm text-gray-200 font-medium">
                I agree to the liability waiver and assume responsibility.
            </span>
          </label>

          {/* Messages */}
          {(message || cardError) && (
            <div className={`text-center font-bold p-4 rounded-lg mb-6 border ${
              (message?.includes('Confirmed') && !cardError)
              ? 'bg-green-900/40 text-green-400 border-green-800' 
              : 'bg-red-900/40 text-red-400 border-red-800'
            }`}>
              {cardError || message}
            </div>
          )}

          {/* Action Button */}
          <button 
            type="button"
            onClick={handleConfirm} 
            disabled={loading || !agreed}
            className={`w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-5 rounded-2xl text-2xl font-bold shadow-lg transition-all active:scale-95`}
          >
            {loading ? 'Processing...' : (
                agreed 
                 ? (isEditing ? 'Update Reservation' : (payNow ? `Pay $${total.toFixed(2)} & Book` : 'Confirm Booking')) 
                 : 'Agree to Continue'
            )}
          </button>
        </div>
      )}
    </div>
  );
}