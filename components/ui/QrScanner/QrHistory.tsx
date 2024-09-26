import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getUserDetails, insertIntoQrHistorys, fetchQrHistoryInfo } from '@/utils/supabase/queries';
import QrCodeScanner from './QrCodeScanner';

const QRHistoryScanner = () => {
  const [scanResults, setScanResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch user details and previous QR code scans
  useEffect(() => {
    const fetchUserAndHistory = async () => {
      const user = await getUserDetails(supabase);
      if (!user || user.length === 0) {
        setError('User not authenticated.');
        setLoading(false);
        return;
      }
      const userId = user[0].id;
      setUserId(userId);

      const qrHistory = await fetchUserQrHistory(supabase, userId);
      if (qrHistory && qrHistory.length > 0) {
        const scannedLinks = qrHistory.map((entry: any) => entry.link);
        setScanResults(scannedLinks);
      }

      setLoading(false);
    };

    fetchUserAndHistory();
  }, [supabase]);

  // Function to handle successful scans from QrCodeScanner
  const handleScanSuccess = async (scannedCode: string) => {
    if (userId && !scanResults.includes(scannedCode)) {
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

  // Fetch user's QR code history
  const fetchUserQrHistory = async (supabase: any, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('qr_history')
        .select('link')
        .eq('user', userId);

      if (error) {
        console.error('Error fetching QR history:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error fetching user QR history:', error);
      return [];
    }
  };

  return (
    <div className="qr-scanner">
      {error && <p className="error">{error}</p>}
      <QrCodeScanner onScanSuccess={handleScanSuccess} />

      <div>
        <h2>Scanned QR Codes:</h2>
        {loading ? (
          <p>Loading your scan history...</p>
        ) : scanResults.length > 0 ? (
          <ul>
            {scanResults.map((result, index) => (
              <li key={index}>
                <a href={result.startsWith('http') ? result : `http://${result}`} target="_blank" rel="noopener noreferrer">
                  {result}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No QR codes detected yet.</p>
        )}
      </div>
    </div>
  );
};

export default QRHistoryScanner;
