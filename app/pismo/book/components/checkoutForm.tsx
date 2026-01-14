'use client';

import { useState, useEffect } from 'react';
import PaymentFields from './paymentFields';
import { ChevronLeft, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CheckoutForm({ 
  total, 
  depositTotal = 0, // <--- NEW PROP
  isExpanded, 
  setIsExpanded, 
  onPayment, 
  message, 
  loading,
  isEditing = false,
  selectedItems = [],
  goggles = 0,
  bandannas = 0,
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

  // Logic: Calculate the base price depending on mode (Deposit vs Payment)
  const basePrice = paymentType === 'deposit' ? depositTotal : total;
  
  // Logic: Final Price is either the Base Price OR the Manual Override
  const finalDisplayPrice = useCustomAmount ? Number(customAmount) : basePrice;

  // Auto-check "Pay Now" if using custom amount
  useEffect(() => {
    if (useCustomAmount) setPayNow(true);
  }, [useCustomAmount]);

  // When switching payment types, reset custom amount toggle so it defaults to the correct calculated value
  useEffect(() => {
    setUseCustomAmount(false);
  }, [paymentType, setUseCustomAmount]);

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

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[100] transition-all duration-300 shadow-[0_-5px_25px_rgba(0,0,0,0.3)] ${
      isExpanded 
        ? 'bg-background h-[85vh] rounded-t-3xl border-t border-border' 
        : 'bg-primary text-primary-foreground h-20 cursor-pointer hover:bg-primary/90'
    }`}>
      
      {!isExpanded ? (
        <div onClick={() => setIsExpanded(true)} className="flex justify-between items-center p-5 h-full max-w-5xl mx-auto">
          <span className="text-2xl font-bold">Total: ${finalDisplayPrice.toFixed(2)}</span>
          <span className="animate-pulse font-bold uppercase tracking-widest text-lg flex items-center gap-2">
            {isEditing ? 'Review & Update' : 'Review & Book'} →
          </span>
        </div>
      ) : (
        <div className="flex flex-col h-full max-w-2xl mx-auto">
          
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-5 md:px-8 border-b border-border bg-muted/20 rounded-t-3xl flex justify-between items-center z-50 backdrop-blur-sm">
            <button 
                onClick={() => setIsExpanded(false)} 
                className="text-primary hover:text-primary/80 font-bold flex items-center gap-1 transition-colors"
            >
                <ChevronLeft className="w-5 h-5" /> Back
            </button>
            <h2 className="text-xl font-bold text-foreground">{isEditing ? 'Update Reservation' : 'Confirm Reservation'}</h2>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar pb-32">
            
             <div className="bg-card text-card-foreground p-6 rounded-xl mb-8 border border-border shadow-sm relative overflow-hidden">
               
               {isStaff && (
                 <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider shadow-sm">
                    Staff Mode
                 </div>
               )}

               <div className="text-center mb-6 border-b border-border pb-6">
                  {/* Price Display */}
                  <div className={`text-4xl font-bold mb-2 ${useCustomAmount ? 'text-primary' : 'text-foreground'}`}>
                    ${finalDisplayPrice.toFixed(2)}
                  </div>
                  <div className="text-muted-foreground text-sm uppercase tracking-wide">
                    {paymentType === 'deposit' && payNow ? 'Deposit Amount to Hold' : 'Total Due'}
                  </div>
               </div>

               {/* Staff Controls */}
               {isStaff && (
                 <div className="bg-muted/50 p-4 rounded-lg mb-6 border border-border">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase">Staff Controls</h4>
                    </div>
                    
                    {showDepositOption && (
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button 
                                type="button"
                                onClick={() => setPaymentType('deposit')}
                                className={`p-2 text-sm font-bold rounded transition-colors border shadow-sm ${
                                    paymentType === 'deposit' 
                                    ? 'bg-secondary text-secondary-foreground border-secondary' 
                                    : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                Hold Deposit
                            </button>
                            <button 
                                type="button"
                                onClick={() => setPaymentType('payment')}
                                className={`p-2 text-sm font-bold rounded transition-colors border shadow-sm ${
                                    paymentType === 'payment' 
                                    ? 'bg-primary text-primary-foreground border-primary' 
                                    : 'bg-background border-border text-muted-foreground hover:bg-muted'
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
                                    // Default to the current correct base price when enabling override
                                    if(e.target.checked && (!customAmount || customAmount === 0)) {
                                        setCustomAmount(basePrice);
                                    }
                                }}
                                className="w-4 h-4 accent-primary rounded cursor-pointer"
                            />
                            <span className="text-sm font-medium text-foreground">Custom cost</span>
                        </label>
                        
                        {useCustomAmount && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                <span className="text-muted-foreground font-bold">$</span>
                                <input 
                                    type="number" 
                                    value={customAmount} 
                                    onChange={e => setCustomAmount(parseFloat(e.target.value) || 0)}
                                    className="bg-background border border-input rounded p-1 w-28 text-right text-foreground font-bold focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                        )}
                    </div>
                 </div>
               )}

               {/* === ORDER SUMMARY === */}
               <div className="space-y-3 text-sm">
                  <h3 className="font-bold text-muted-foreground uppercase text-xs mb-3">Order Summary</h3>
                  
                  {/* Guest Count */}
                  <div className="flex justify-between text-muted-foreground border-b border-border pb-2 mb-2">
                    <span>Guests</span>
                    <span className="font-medium text-foreground">
                        {holderInfo?.adults || 1} Adult(s), {holderInfo?.minors || 0} Minor(s)
                    </span>
                  </div>

                  {selectedItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-foreground font-medium">
                      <span>{item.qty}x {item.name} {item.waiver ? '(+Waiver)' : ''}</span>
                      <span>${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                  {goggles > 0 && <div className="flex justify-between text-muted-foreground"><span>{goggles}x Goggles</span><span>${(goggles * 4).toFixed(2)}</span></div>}
                  {bandannas > 0 && <div className="flex justify-between text-muted-foreground"><span>{bandannas}x Bandannas</span><span>${(bandannas * 5).toFixed(2)}</span></div>}
               </div>
            </div>

            {/* Payment Toggle */}
            <div className="mb-8">
                <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors shadow-sm ${
                    payNow 
                    ? 'bg-primary/5 border-primary ring-1 ring-primary/20' 
                    : 'bg-card border-border hover:bg-muted/50'
                }`}>
                    <input 
                        type="checkbox" 
                        checked={payNow} 
                        onChange={e => setPayNow(e.target.checked)} 
                        className="w-5 h-5 accent-primary cursor-pointer"
                    />
                    <div>
                        <span className="block font-bold text-foreground">
                            {paymentType === 'deposit' ? 'Process Deposit Now' : 'Pay with Card Now'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {paymentType === 'deposit' 
                                ? `Authorize card for security deposit ($${finalDisplayPrice.toFixed(0)} Hold)` 
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

            {/* Waiver Agreement */}
            <label className={`flex gap-4 items-start p-4 rounded-xl mb-8 cursor-pointer border transition-colors ${
                agreed 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10'
            }`}>
              <div className="mt-1">
                 {agreed 
                    ? <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    : <ShieldCheck className="w-6 h-6 text-destructive" />
                 }
              </div>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="hidden" />
              <span className={`text-sm font-medium leading-relaxed ${agreed ? 'text-foreground' : 'text-foreground'}`}>
                I agree to the liability waiver and assume full responsibility for any equipment damages.
              </span>
            </label>

            {/* Messages */}
            {(message || cardError) && (
              <div className={`text-center font-bold p-4 rounded-lg mb-6 border animate-pulse flex items-center justify-center gap-2 ${
                (message?.includes('Success') || message?.includes('Confirmed') || message?.includes('Updated')) && !cardError 
                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' 
                : 'bg-destructive/10 text-destructive border-destructive/20'
              }`}>
                {cardError && <AlertCircle className="w-5 h-5" />}
                {cardError || message}
              </div>
            )}

            {/* Main Action Button */}
            <button 
              type="button"
              onClick={handleConfirm} 
              disabled={loading || !agreed}
              className={`w-full hover:brightness-110 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground py-5 rounded-2xl text-2xl font-bold shadow-lg transition-all active:scale-[0.98] ${
                 paymentType === 'deposit' && payNow ? 'bg-secondary text-secondary-foreground' : 'bg-primary'
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