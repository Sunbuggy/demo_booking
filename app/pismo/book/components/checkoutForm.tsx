// 'use client';

// import { useState, useEffect, useRef } from 'react';

// declare global {
//   interface Window {
//     CollectJS: any;
//   }
// }

// export default function CheckoutForm({ 
//   total, 
//   isExpanded, 
//   setIsExpanded, 
//   onPayment, 
//   message, 
//   loading 
// }: any) {
//   const [agreed, setAgreed] = useState(false);
//   const [billing, setBilling] = useState({ address: '', city: '', state: '', zip: '' });
//   const [isNmiReady, setIsNmiReady] = useState(false);
  
//   const initializationAttempted = useRef(false);

//   // === 1. Load & Configure NMI ===
//   useEffect(() => {
//     if (!isExpanded) {
//       initializationAttempted.current = false;
//       setIsNmiReady(false);
//       return;
//     }

//     if (initializationAttempted.current) return;

//     // Use hardcoded key for testing to rule out .env issues
//     const tokenKey = process.env.NEXT_PUBLIC_NMI_TOKENIZATION_KEY || 'THwEs5-Fd5nGt-kAkBMB-yHr7Qz';

//     // --- Configuration Logic ---
//     const configureCollectJS = () => {
//       const field = document.getElementById('cc-number');
//       if (!field) {
//         setTimeout(configureCollectJS, 200);
//         return;
//       }

//       if (!window.CollectJS) {
//          console.warn("CollectJS not loaded yet...");
//          setTimeout(configureCollectJS, 200);
//          return;
//       }

//       try {
//         console.log("Configuring NMI...");
        
//         // Strict configuration
//         window.CollectJS.configure({
//           variant: 'inline',
//           price: total.toFixed(2),
//           currency: 'USD',
//           country: 'US',
//           fields: {
//             ccnumber: {
//               selector: '#cc-number',
//               placeholder: '0000 0000 0000 0000'
//             },
//             ccexp: {
//               selector: '#cc-exp',
//               placeholder: 'MM / YY'
//             },
//             cvv: {
//               selector: '#cc-cvv',
//               placeholder: '123'
//             }
//           },
//           callback: (response: { token?: string; error?: string }) => {
//             if (response.token) {
//               onPayment(response.token, billing);
//             } else {
//               console.error("Token Error:", response);
//               alert("Payment Error: " + (response.error || "Check card details"));
//             }
//           }
//         });

//         // Verify it actually worked
//         if (typeof window.CollectJS.tokenise === 'function' || typeof window.CollectJS.tokenize === 'function') {
//             console.log("NMI Ready!");
//             setIsNmiReady(true);
//             initializationAttempted.current = true;
//         } else {
//             console.error("NMI loaded but rejected key/domain. Check NMI Portal Settings.");
//         }

//       } catch (err) {
//         console.error("NMI Config Error:", err);
//       }
//     };

//     // --- Script Loading (With 'inline' variant forced) ---
//     if (!window.CollectJS) {
//       const script = document.createElement('script');
//       script.src = "https://secure.networkmerchants.com/token/Collect.js";
//       script.setAttribute('data-tokenization-key', tokenKey);
//       // FORCE INLINE VARIANT ON LOAD
//       script.setAttribute('data-variant', 'inline'); 
//       script.async = true;
//       script.onload = () => setTimeout(configureCollectJS, 500);
//       document.body.appendChild(script);
//     } else {
//       configureCollectJS();
//     }
//   }, [isExpanded, total, onPayment, billing]);

//   // === 2. Submit Handler ===
//   const handleSubmit = () => {
//     if (!billing.zip || !billing.address) {
//         alert("Please enter billing address.");
//         return;
//     }
    
//     if (window.CollectJS) {
//        if (typeof window.CollectJS.tokenise === 'function') {
//           window.CollectJS.tokenise();
//        } else if (typeof window.CollectJS.tokenize === 'function') {
//           window.CollectJS.tokenize();
//        } else {
//           // If we reach here, the key is definitely blocked by NMI settings
//           alert("Payment Error: NMI rejected this domain (localhost). Whitelist it in NMI settings.");
//        }
//     } else {
//        alert("Payment system loading...");
//     }
//   };

//   return (
//     <div className={`fixed bottom-0 left-0 right-0 z-[100] transition-all duration-300 ${
//       isExpanded ? 'bg-gray-900 h-[90vh] rounded-t-3xl shadow-2xl border-t border-gray-700' : 'bg-orange-600 h-20 cursor-pointer'
//     }`}>
      
//       {!isExpanded ? (
//         <div onClick={() => setIsExpanded(true)} className="flex justify-between items-center p-5 h-full">
//           <span className="text-xl font-bold">Total: ${total.toFixed(2)}</span>
//           <span className="animate-pulse font-bold uppercase tracking-widest">Review & Pay →</span>
//         </div>
//       ) : (
//         <div className="p-6 md:p-8 overflow-y-auto h-full max-w-2xl mx-auto">
//           <div className="flex justify-between items-center mb-6">
//             <button onClick={() => setIsExpanded(false)} className="text-orange-400 hover:text-orange-300">← Back</button>
//             <h2 className="text-xl font-bold text-white">Secure Payment</h2>
//           </div>
          
//           <div className="bg-gray-800 p-4 rounded-xl mb-6 border border-gray-700">
//              <div className="flex justify-between font-bold text-lg text-white">
//               <span>Total Amount:</span>
//               <span>${total.toFixed(2)}</span>
//             </div>
//           </div>

//           <div className="space-y-4 mb-8">
//               <h3 className="text-white font-semibold mb-2">Billing Address</h3>
//               <input placeholder="Street Address" value={billing.address} onChange={e => setBilling({...billing, address: e.target.value})} className="w-full p-3 bg-white rounded text-black focus:outline-none focus:ring-2 focus:ring-orange-500" />
//               <div className="grid grid-cols-2 gap-4">
//                  <input placeholder="City" value={billing.city} onChange={e => setBilling({...billing, city: e.target.value})} className="p-3 bg-white rounded text-black focus:outline-none focus:ring-2 focus:ring-orange-500" />
//                  <div className="grid grid-cols-2 gap-2">
//                     <input placeholder="State" maxLength={2} value={billing.state} onChange={e => setBilling({...billing, state: e.target.value.toUpperCase()})} className="p-3 bg-white rounded text-black focus:outline-none focus:ring-2 focus:ring-orange-500" />
//                     <input placeholder="ZIP" value={billing.zip} onChange={e => setBilling({...billing, zip: e.target.value})} className="p-3 bg-white rounded text-black focus:outline-none focus:ring-2 focus:ring-orange-500" />
//                  </div>
//               </div>
//           </div>

//           <label className="flex gap-4 items-start bg-red-950/30 p-4 rounded-xl mb-8 cursor-pointer border border-red-800/50">
//             <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="w-6 h-6 mt-1 accent-orange-500 cursor-pointer" />
//             <span className="text-sm text-gray-200 font-medium">I agree to the liability waiver and assume responsibility.</span>
//           </label>

//           <div className="space-y-6 pb-24">
//               <div className="space-y-1">
//                 <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Card Number</label>
//                 <div id="cc-number" className="p-4 bg-white rounded-lg h-14 w-full shadow-inner" />
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-1">
//                   <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Expiration</label>
//                   <div id="cc-exp" className="p-4 bg-white rounded-lg h-14 w-full shadow-inner" />
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-xs font-semibold text-gray-400 uppercase ml-1">CVV</label>
//                   <div id="cc-cvv" className="p-4 bg-white rounded-lg h-14 w-full shadow-inner" />
//                 </div>
//               </div>

//               {message && (
//                 <div className={`text-center font-bold p-4 rounded-lg border ${message.includes('Success') ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-red-900/40 text-red-400 border-red-800'}`}>{message}</div>
//               )}

//               <button 
//                 type="button"
//                 onClick={handleSubmit} 
//                 disabled={loading || !agreed}
//                 className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-5 rounded-2xl text-2xl font-bold shadow-lg transition-all active:scale-95"
//               >
//                 {loading ? 'Processing...' : (agreed ? `Pay $${total.toFixed(2)} Now` : 'Accept Waiver to Pay')}
//               </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
'use client';

import { useState } from 'react';

export default function CheckoutForm({ 
  total, 
  isExpanded, 
  setIsExpanded, 
  onPayment, 
  message, 
  loading,
  isEditing = false // <-- Defaults to false for new bookings
}: any) {
  const [agreed, setAgreed] = useState(false);

  const handleConfirm = () => {
    onPayment(); 
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[100] transition-all duration-300 ${
      isExpanded ? 'bg-gray-900 h-[50vh] rounded-t-3xl shadow-2xl border-t border-gray-700' : 'bg-orange-600 h-20 cursor-pointer'
    }`}>
      
      {!isExpanded ? (
        <div onClick={() => setIsExpanded(true)} className="flex justify-between items-center p-5 h-full">
          <span className="text-xl font-bold">Total: ${total.toFixed(2)}</span>
          <span className="animate-pulse font-bold uppercase tracking-widest">
            {isEditing ? 'Review & Update →' : 'Review & Book →'}
          </span>
        </div>
      ) : (
        <div className="p-6 md:p-8 overflow-y-auto h-full max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setIsExpanded(false)} className="text-orange-400 hover:text-orange-300">← Back</button>
            <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Update Reservation' : 'Confirm Reservation'}
            </h2>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-gray-700 text-center">
             <div className="text-4xl font-bold text-white mb-2">
              ${total.toFixed(2)}
            </div>
            <div className="text-gray-400 text-sm uppercase tracking-wide">
                {isEditing ? 'New Total Amount' : 'Total Due Upon Arrival'}
            </div>
          </div>

          <label className="flex gap-4 items-start bg-red-950/30 p-4 rounded-xl mb-8 cursor-pointer border border-red-800/50 hover:bg-red-900/40 transition-colors">
            <input 
              type="checkbox" 
              checked={agreed} 
              onChange={e => setAgreed(e.target.checked)} 
              className="w-6 h-6 mt-1 accent-orange-500 cursor-pointer" 
            />
            <span className="text-sm text-gray-200 font-medium">
                I agree to the liability waiver and assume responsibility for equipment damages.
            </span>
          </label>

          {message && (
            <div className={`text-center font-bold p-4 rounded-lg mb-6 border ${
              message.includes('Success') || message.includes('Confirmed') || message.includes('Updated')
              ? 'bg-green-900/40 text-green-400 border-green-800' 
              : 'bg-red-900/40 text-red-400 border-red-800'
            }`}>
              {message}
            </div>
          )}

          <button 
            type="button"
            onClick={handleConfirm} 
            disabled={loading || !agreed}
            className={`w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-5 rounded-2xl text-2xl font-bold shadow-lg transition-all active:scale-95`}
          >
            {loading ? 'Saving...' : (agreed ? (isEditing ? 'Update Reservation' : 'Confirm Booking') : 'Agree to Continue')}
          </button>
        </div>
      )}
    </div>
  );
}