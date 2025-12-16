'use client'
import { createClient } from "@/utils/supabase/client";
import React, { useState, useRef, useEffect } from 'react';

function ChargesPismo() {
  const supabase = await createClient();
  const [reservationNumber, setReservationNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isDeposit, setIsDeposit] = useState(false);
  const [isCash, setIsCash] = useState(false);
  const [cashStatus, setCashStatus] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [iframeSrc, setIframeSrc] = useState('https://www.sunbuggy.com/Las_Vegas/acombP.php');
  const cashIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleGenerate = async () => {
    const parsedAmount = parseFloat(amount);
    if (parsedAmount < 0.01) {
      alert('Amount must be a positive value');
      return;
    }
    
    const prefix = isDeposit ? "Deposit_" : "";
    const timestamp = Date.now();
    
    // Set iframe source
    setIframeSrc(
      `https://oceanoatvrentals.com/lib/oauthorizetestPP.php?invoiceNumber=${prefix}${reservationNumber}&cacke=${timestamp}&qost=${amount}&fname=${firstName}&lname=${lastName}`
    );

    // Get current user for created_by field
    const { data: { user } } = await supabase.auth.getUser();
    
    // Create current timestamp in the correct format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // Format: 'YYYY-MM-DD HH:mm:ss'
    const createdAt = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    
    // Insert into charges_pismo table
    const { error } = await supabase
      .from('charges_pismo')
      .insert({
        amount: amount,
        reservation_number: reservationNumber,
        notes: notes,
        created_by: user?.id || 'unknown',
        created_at: createdAt,
        first_name: firstName,  
        last_name: lastName 
      } as any); // Type assertion to fix the TypeScript error

    if (error) {
      console.error('Error saving to database:', error);
      alert('Error saving payment record. Check console for details.');
    } else {
      console.log('Payment record saved successfully');
    }
  };

  // Handle cash payment polling
  useEffect(() => {
    if (isCash) {
      if (!amount) {
        setIsCash(false);
        alert('Amount must have a value first');
        return;
      }
      
      cashIntervalRef.current = setInterval(() => {
        fetch(`/AJAXcashpymt.php?resno=${reservationNumber}&amt=${amount}`)
          .then(response => response.text())
          .then(text => setCashStatus(text))
          .catch(error => console.error('Error fetching cash status:', error));
      }, 830);
    } else if (cashIntervalRef.current) {
      clearInterval(cashIntervalRef.current);
    }

    return () => {
      if (cashIntervalRef.current) {
        clearInterval(cashIntervalRef.current);
      }
    };
  }, [isCash, amount, reservationNumber]);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Payment Processing</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block mb-2">
            First Name:
            <input 
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </label>
          
          <label className="block mb-2">
            Last Name:
            <input 
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </label>
          
          <label className="block mb-2">
            Reservation Number:
            <input 
              type="text"
              value={reservationNumber}
              onChange={(e) => setReservationNumber(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </label>

          <label className="block mb-2">
            Notes:
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </label>
        </div>
        
        <div>
          <label className="block mb-2">
            Amount ($):
            <input 
              type="number"
              id="wafe"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              className="w-full p-2 border rounded"
            />
          </label>
        </div>
      </div>
      <span>Please wait for the 'Thank you for your payment' message after pressing pay to  make sure it went through.</span> <br></br>
      <button 
        onClick={handleGenerate}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-6"
      >
        Generate Payment Page
      </button>
      
      <div className="mb-6">
        <iframe 
          name="ccwin"
          id="ccwin"
          src={iframeSrc}
          title="Payment Gateway"
          className="w-full border"
          style={{ height: '340px' }}
        />
      </div>
      
      <div id="cashlook" className="min-h-6">
        {cashStatus}
      </div>
    </div>
  );
}

export default ChargesPismo;