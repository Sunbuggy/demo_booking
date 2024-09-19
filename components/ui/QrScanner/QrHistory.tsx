'use client';
import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { createClient } from '@/utils/supabase/server'; // Supabase server client
import { getUserDetails, insertIntoQrHistorys, fetchQrHistoryInfo } from '@/utils/supabase/queries';

const QrCodeScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanResults, setScanResults] = useState<string[]>([]); // Store multiple results
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Loading state for history
  const [userId, setUserId] = useState<string | null>(null); // Track user ID

  // Fetch user details and previous QR code scans
  useEffect(() => {
    const supabase = createClient();

    const fetchUserAndHistory = async () => {
      // Fetch user details
      const user = await getUserDetails(supabase);
      if (!user || user.length === 0) {
        setError('User not authenticated.');
        setLoading(false);
        return;
      }
      const userId = user[0].id; // Assuming 'id' is the user's ID
      setUserId(userId);

      // Fetch previously scanned QR codes
      const qrHistory = await fetchUserQrHistory(supabase, userId);
      if (qrHistory && qrHistory.length > 0) {
        const scannedLinks = qrHistory.map((entry: any) => entry.qr_link);
        setScanResults(scannedLinks);
      }

      setLoading(false);
    };

    fetchUserAndHistory();
  }, []);

  // Handle QR code scanning and saving results
  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    if (videoRef.current && userId) {
      codeReader
        .decodeFromVideoDevice(undefined, videoRef.current, async (result, err) => {
          if (result) {
            const scannedCode = result.getText();

            // Add the new result if it hasn't been scanned already
            if (!scanResults.includes(scannedCode)) {
              setScanResults((prevResults) => [...prevResults, scannedCode]);

              // Save the new QR code to the database
              const supabase = createClient();
              await insertIntoQrHistorys(supabase, {
                user: userId,
                link: scannedCode, 
                // scanned_at: new Date(), // Add a timestamp
              });
            }
          }

          if (err && !(err.name === 'NotFoundException')) {
            setError('Error scanning QR Code. Please try again.');
          }
        })
        .then((controls) => {
          controlsRef.current = controls;
        })
        .catch((err) => {
          setError(`Camera error: ${err.message}`);
        });
    }

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, [scanResults, userId]); // Dependency includes userId

  // Fetch user's QR code history (modified fetchQrHistoryInfo)
  const fetchUserQrHistory = async (supabase: any, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('qr_history')
        .select('qr_link')
        .eq('user_id', userId);

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
      <video ref={videoRef} style={{ width: '100%', height: 'auto' }} />

      <div>
        <h2>Scanned QR Codes:</h2>
        {loading ? (
          <p>Loading your scan history...</p>
        ) : scanResults.length > 0 ? (
          <ul>
            {scanResults.map((result, index) => (
              <li key={index}>
                {/* Render the result as a clickable link */}
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

export default QrCodeScanner;
