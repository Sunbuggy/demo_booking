'use client'
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getUserDetails, insertIntoQrHistorys } from '@/utils/supabase/queries';
import QrCodeScanner from './QrCodeScanner';
import QRHistoryList from './QrHistory';

const QrFunction = () => {
  const [scanResults, setScanResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      const user = await getUserDetails(supabase);
      if (user && user.length > 0) {
        setUserId(user[0].id);
      } else {
        setError('User not authenticated.');
      }
    };

    fetchUserDetails();
  }, [supabase]);

  // Handle successful scans and save them to the database
  const handleScanSuccess = async (scannedCode: string) => {
    if (userId && !scanResults.includes(scannedCode)) {
      // Add the new scan to the list
      setScanResults((prevResults) => [...prevResults, scannedCode]);

      // Save the new QR code to the database
      try {
        await insertIntoQrHistorys(supabase, {
          user: userId,
          link: scannedCode,
        });
      } catch (e) {
        console.error('Error inserting QR code:', e);
        setError('Failed to save scanned QR code to the database.');
      }
    }
  };

  return (
    <div className="qr-scanner-and-history">
      {error && <p className="error">{error}</p>}

      {/* QR Code Scanner */}
      <QrCodeScanner onScanSuccess={handleScanSuccess} />

      {/* QR History List */}
      <QRHistoryList />
    </div>
  );
};

export default QrFunction;
