'use client';
import React from 'react';
import { ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react'; 

interface BookingPayProps {
  reservationId: number;
  totalPrice: number;
  firstName: string;
  lastName: string;
}

const BookingPay: React.FC<BookingPayProps> = ({ 
  reservationId, 
  totalPrice, 
  firstName, 
  lastName 
}) => {
  // Generate payment URL
  const generatePaymentUrl = () => {
    const timestamp = Date.now();
    return `https://oceanoatvrentals.com/lib/oauthorizetestP.php?invoiceNumber=${reservationId}&cacke=${timestamp}&qost=${totalPrice}&fname=${encodeURIComponent(firstName)}&lname=${encodeURIComponent(lastName)}`;
  };

  const paymentUrl = generatePaymentUrl();

  return (
    <div className="w-full space-y-4">
      {/* 1. SEMANTIC ALERT BOX */}
      {/* Old: bg-yellow-500/10 border-yellow-500/30 */}
      {/* New: bg-primary/10 border-primary/20 (Uses Brand Color semantically) */}
      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex gap-3 items-start">
        {/* Old: text-yellow-500 */}
        {/* New: text-primary */}
        <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        
        <div className="space-y-1">
          {/* Old: text-yellow-200/90 */}
          {/* New: text-foreground/80 (Readable in both Light/Dark) */}
          <p className="text-sm text-foreground/80 leading-relaxed">
            <span className="font-bold text-primary">Important:</span> Please wait for the <span className="font-bold text-foreground">"Thank you for your payment"</span> message 
            after pressing Pay to ensure your transaction is complete.
          </p>
          
          {/* Old: text-slate-400 border-yellow-500/20 */}
          {/* New: text-muted-foreground border-primary/20 */}
          <div className="text-xs text-muted-foreground font-mono pt-2 border-t border-primary/20 mt-2 flex gap-4">
            {/* Old: text-slate-200 */}
            {/* New: text-foreground */}
            <span>Res ID: <strong className="text-foreground">#{reservationId}</strong></span>
            
            {/* Money: We use a utility class that works in both modes because 'success' isn't in the base variables */}
            <span>Total: <strong className="text-green-600 dark:text-green-400">${totalPrice.toFixed(2)}</strong></span>
          </div>
        </div>
      </div>
      
      {/* 2. PAYMENT IFRAME CONTAINER */}
      {/* Old: bg-white border-slate-700 */}
      {/* New: bg-card border-border (Adapts to Light/Dark mode backgrounds) */}
      <div className="w-full border border-border rounded-lg overflow-hidden bg-card shadow-sm">
        <iframe 
          name="ccwin"
          id="ccwin"
          src={paymentUrl}
          title="Payment Gateway"
          className="w-full h-[500px]"
          style={{ border: 'none' }}
        />
      </div>
      
      {/* 3. FOOTER / ACTIONS */}
      <div className="flex flex-col items-center justify-center gap-3 pt-2">
        {/* Old: text-slate-500 */}
        {/* New: text-muted-foreground */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-3 h-3" />
          <span>Secure payment processed by Authorize.net</span>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          // Old: text-blue-400 hover:bg-blue-950/30
          // New: text-primary hover:bg-primary/10
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors py-2 px-4 rounded-md hover:bg-primary/10 font-medium"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh Page Status
        </button>
      </div>
    </div>
  );
};

export default BookingPay;