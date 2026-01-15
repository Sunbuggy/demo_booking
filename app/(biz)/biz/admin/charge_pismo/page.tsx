'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client'; // Client-side Supabase

export default function ChargesPismo() {
  // State for Supabase client and loading
  const [supabase, setSupabase] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [reservationNumber, setReservationNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isDeposit, setIsDeposit] = useState(false);
  const [isCash, setIsCash] = useState(false);
  const [cashStatus, setCashStatus] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [iframeSrc, setIframeSrc] = useState('https://www.sunbuggy.com/Las_Vegas/acombP.php');

  // Ref for cash polling interval
  const cashIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Supabase client on mount (client-side only)
  useEffect(() => {
    const client = createClient();
    setSupabase(client);
    setIsLoading(false);
  }, []);

  const handleGenerate = async () => {
    if (isLoading || !supabase) {
      alert('System is still loading. Please wait.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0.01) {
      alert('Amount must be a positive value greater than $0.01');
      return;
    }

    const prefix = isDeposit ? "Deposit_" : "";
    const timestamp = Date.now();

    // Update iframe source with payment details
    setIframeSrc(
      `https://oceanoatvrentals.com/lib/oauthorizetestPP.php?invoiceNumber=${prefix}${reservationNumber}&cacke=${timestamp}&qost=${amount}&fname=${encodeURIComponent(firstName)}&lname=${encodeURIComponent(lastName)}`
    );

    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError);
        alert('Unable to identify user for logging. Payment page loaded anyway.');
      }

      // Format current timestamp for database
      const now = new Date();
      const createdAt = now.toISOString().slice(0, 19).replace('T', ' '); // 'YYYY-MM-DD HH:mm:ss'

      // Insert record into charges_pismo table
      const { error } = await supabase
        .from('charges_pismo')
        .insert({
          amount: parsedAmount,
          reservation_number: reservationNumber,
          notes: notes || null,
          created_by: user?.id || null,
          created_at: createdAt,
          first_name: firstName || null,
          last_name: lastName || null,
        });

      if (error) {
        console.error('Database insert error:', error);
        alert('Payment page loaded, but failed to save record. Check console.');
      } else {
        console.log('Payment record saved successfully');
      }
    } catch (err) {
      console.error('Unexpected error during save:', err);
      alert('Payment page loaded, but an error occurred while saving.');
    }
  };

  // Cash payment polling effect
  useEffect(() => {
    if (isCash) {
      if (!amount || parseFloat(amount) <= 0) {
        setIsCash(false);
        alert('Please enter a valid amount before enabling cash mode');
        return;
      }

      cashIntervalRef.current = setInterval(() => {
        fetch(`/AJAXcashpymt.php?resno=${reservationNumber}&amt=${amount}`)
          .then(res => res.text())
          .then(text => setCashStatus(text))
          .catch(err => console.error('Cash status fetch error:', err));
      }, 830);
    } else {
      if (cashIntervalRef.current) {
        clearInterval(cashIntervalRef.current);
        cashIntervalRef.current = null;
      }
    }

    return () => {
      if (cashIntervalRef.current) {
        clearInterval(cashIntervalRef.current);
      }
    };
  }, [isCash, amount, reservationNumber]);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p>Loading payment system...</p>
      </div>
    );
  }

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
              className="w-full p-2 border rounded mt-1"
            />
          </label>

          <label className="block mb-2">
            Last Name:
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          </label>

          <label className="block mb-2">
            Reservation Number:
            <input
              type="text"
              value={reservationNumber}
              onChange={(e) => setReservationNumber(e.target.value)}
              className="w-full p-2 border rounded mt-1"
              placeholder="e.g. 100037222"
            />
          </label>

          <label className="block mb-2">
            Notes:
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded mt-1"
              rows={3}
              placeholder="Reason for charge"
            />
          </label>
        </div>

        <div>
          <label className="block mb-2">
            Amount ($):
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              className="w-full p-2 border rounded mt-1"
              placeholder="e.g. 243.49"
            />
          </label>

          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isDeposit}
                onChange={(e) => setIsDeposit(e.target.checked)}
                className="mr-2"
              />
              Deposit
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isCash}
                onChange={(e) => setIsCash(e.target.checked)}
                className="mr-2"
              />
              Cash Mode
            </label>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Please wait for the 'Thank you for your payment' message after pressing pay to make sure it went through.
      </p>

      <button
        onClick={handleGenerate}
        disabled={isLoading || !reservationNumber || !amount}
        className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded mb-6"
      >
        Generate Payment Page
      </button>

      <div className="mb-6">
        <iframe
          name="ccwin"
          id="ccwin"
          src={iframeSrc}
          title="Payment Gateway"
          className="w-full border rounded"
          style={{ height: '340px' }}
        />
      </div>

      <div id="cashlook" className="min-h-6 text-sm font-medium">
        {cashStatus}
      </div>
    </div>
  );
}