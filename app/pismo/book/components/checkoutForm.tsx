'use client';

import { useState, useEffect } from 'react';
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
  bandannas = 0,
  // --- IMPORTANT: Ensure holderInfo is passed ---
  holderInfo, 
  // --- Staff Props ---
  userLevel = 0, 
  paymentType,
  setPaymentType,
  customAmount,
  setCustomAmount,
  useCustomAmount,
  setUseCustomAmount
}: any) {
  const [agreed, setAgreed] = useState(false);
  const [payNow, setPayNow] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const isStaff = userLevel >= 300;
  const showDepositOption = isStaff && isEditing;

  useEffect(() => {
    if (useCustomAmount) setPayNow(true);
  }, [useCustomAmount]);

  const handleConfirm = () => {
    setCardError(null);
    if (payNow) {
        const hiddenBtn = document.getElementById('nmi-hidden-btn');
        if (hiddenBtn && window.CollectJS) {
            console.log("Triggering NMI...");
            hiddenBtn.click();
        } else {
            setCardError("Payment system is still loading. Please refresh.");
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

  const finalDisplayPrice = useCustomAmount ? Number(customAmount) : total;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[100] transition-all duration-300 ${
      isExpanded ? 'bg-gray-900 h-[85vh] rounded-t-3xl shadow-2xl border-t border-gray-700' : 'bg-orange-600 h-20 cursor-pointer'
    }`}>
      
      {!isExpanded ? (
        <div onClick={() => setIsExpanded(true)} className="flex justify-between items-center p-5 h-full">
          <span className="text-xl font-bold">Total: ${finalDisplayPrice.toFixed(2)}</span>
          <span className="animate-pulse font-bold uppercase tracking-widest">
            {isEditing ? 'Review & Update →' : 'Review & Book →'}
          </span>
        </div>
      ) : (
        <div className="flex flex-col h-full max-w-2xl mx-auto">
          
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-5 md:px-8 border-b border-gray-800 bg-gray-900 rounded-t-3xl flex justify-between items-center z-50">
            <button onClick={() => setIsExpanded(false)} className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1"><span>←</span> Back</button>
            <h2 className="text-xl font-bold text-white">{isEditing ? 'Update Reservation' : 'Confirm Reservation'}</h2>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar pb-32">
            
             <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-gray-700 shadow-lg relative overflow-hidden">
               
               {isStaff && (
                 <div className="absolute top-0 right-0 bg-blue-600 text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider shadow-lg">
                    Staff Mode
                 </div>
               )}

               <div className="text-center mb-6 border-b border-gray-700 pb-6">
                  <div className={`text-4xl font-bold mb-2 ${useCustomAmount ? 'text-yellow-400' : 'text-white'}`}>
                    ${finalDisplayPrice.toFixed(2)}
                  </div>
                  <div className="text-gray-400 text-sm uppercase tracking-wide">
                    {paymentType === 'deposit' && payNow ? 'Deposit Amount to Hold' : 'Total Due'}
                  </div>
               </div>

               {/* Staff Controls */}
               {isStaff && (
                 <div className="bg-gray-900/50 p-4 rounded-lg mb-6 border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase">Staff Controls</h4>
                    </div>
                    
                    {showDepositOption && (
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button 
                                type="button"
                                onClick={() => setPaymentType('deposit')}
                                className={`p-2 text-sm font-bold rounded transition-colors border ${
                                    paymentType === 'deposit' 
                                    ? 'bg-blue-600 border-blue-500 text-white' 
                                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                                }`}
                            >
                                Hold Deposit
                            </button>
                            <button 
                                type="button"
                                onClick={() => setPaymentType('payment')}
                                className={`p-2 text-sm font-bold rounded transition-colors border ${
                                    paymentType === 'payment' 
                                    ? 'bg-green-600 border-green-500 text-white' 
                                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                                }`}
                            >
                                Charge Payment
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                checked={useCustomAmount} 
                                onChange={e => {
                                    setUseCustomAmount(e.target.checked);
                                    if(e.target.checked && (!customAmount || customAmount === 0)) {
                                        setCustomAmount(total);
                                    }
                                }}
                                className="w-4 h-4 accent-yellow-500 rounded cursor-pointer"
                            />
                            <span className="text-sm font-medium text-gray-300">Override Total Price</span>
                        </label>
                        
                        {useCustomAmount && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                <span className="text-gray-400 font-bold">$</span>
                                <input 
                                    type="number" 
                                    value={customAmount} 
                                    onChange={e => setCustomAmount(parseFloat(e.target.value) || 0)}
                                    className="bg-gray-700 border border-gray-500 rounded p-1 w-28 text-right text-white font-bold focus:border-yellow-500 outline-none"
                                />
                            </div>
                        )}
                    </div>
                 </div>
               )}

               {/* === ORDER SUMMARY === */}
               <div className="space-y-3 text-sm">
                  <h3 className="font-bold text-gray-400 uppercase text-xs mb-3">Order Summary</h3>
                  
                  {/* --- NEW: Guest Count --- */}
                  <div className="flex justify-between text-gray-300 border-b border-gray-700/50 pb-2 mb-2">
                    <span>Guests</span>
                    <span className="font-medium text-white">
                        {holderInfo?.adults || 1} Adult(s), {holderInfo?.minors || 0} Minor(s)
                    </span>
                  </div>

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

            <div className="mb-8">
                <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    payNow ? 'bg-gray-700 border-orange-500/50' : 'bg-gray-800 border-gray-600 hover:bg-gray-750'
                }`}>
                    <input 
                        type="checkbox" 
                        checked={payNow} 
                        onChange={e => setPayNow(e.target.checked)} 
                        className="w-5 h-5 accent-orange-500 cursor-pointer"
                    />
                    <div>
                        <span className="block font-bold text-white">
                            {paymentType === 'deposit' ? 'Process Deposit Now' : 'Pay with Card Now'}
                        </span>
                        <span className="text-xs text-gray-400">
                            {paymentType === 'deposit' 
                                ? 'Authorize card for security deposit (Hold)' 
                                : 'Charge card immediately via NMI'
                            }
                        </span>
                    </div>
                </label>
            </div>

            {payNow && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <PaymentFields onTokenGenerated={handleTokenGenerated} onError={handleCardError} />
                </div>
            )}

            <label className="flex gap-4 items-start bg-red-950/30 p-4 rounded-xl mb-8 cursor-pointer border border-red-800/50 hover:bg-red-900/40 transition-colors">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="w-6 h-6 mt-1 accent-orange-500 cursor-pointer shrink-0" />
              <span className="text-sm text-gray-200 font-medium leading-relaxed">I agree to the liability waiver and assume full responsibility for any equipment damages.</span>
            </label>

            {(message || cardError) && (
              <div className={`text-center font-bold p-4 rounded-lg mb-6 border animate-pulse ${
                (message?.includes('Success') || message?.includes('Confirmed') || message?.includes('Updated')) && !cardError 
                ? 'bg-green-900/40 text-green-400 border-green-800' 
                : 'bg-red-900/40 text-red-400 border-red-800'
              }`}>{cardError || message}</div>
            )}

            <button 
              type="button"
              onClick={handleConfirm} 
              disabled={loading || !agreed}
              className={`w-full hover:brightness-110 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-5 rounded-2xl text-2xl font-bold shadow-lg transition-all active:scale-[0.98] ${
                 paymentType === 'deposit' && payNow ? 'bg-blue-600' : 'bg-orange-600'
              }`}
            >
              {loading ? 'Processing...' : (
                  agreed 
                   ? (payNow 
                        ? (paymentType === 'deposit' ? `Authorize Deposit $${finalDisplayPrice.toFixed(0)}` : `Pay $${finalDisplayPrice.toFixed(2)}`) 
                        : (isEditing ? 'Update Reservation' : 'Confirm Booking')
                     ) 
                   : 'Agree to Continue'
              )}
            </button>
            
          </div>
        </div>
      )}
    </div>
  );
}