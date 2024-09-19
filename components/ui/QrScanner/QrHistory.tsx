import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { createClient } from '@/utils/supabase/client'; // Import your client setup
import { getUser } from '@/utils/supabase/queries'; // Reuse the getUser function
import { Database } from '@/types_db'; // Assuming this is where your types are defined

const QrCodeScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanResults, setScanResults] = useState<string[]>([]); // Store multiple results
  const [previousScanResults, setPreviousScanResults] = useState<string[]>([]); // Store previously scanned QR codes
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const supabase = createClient(); // Initialize Supabase client
  
  // Function to fetch the user's scanned QR codes from Supabase
  const fetchUserScans = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('qr_history')
        .select('link')
        .eq('user', userId);
      
      if (error) {
        console.error('Error fetching previous scan results:', error.message);
        return;
      }

      if (data) {
        // Filter out null links before updating state
        const validLinks = data.map((row) => row.link).filter((link): link is string => link !== null);
        setPreviousScanResults(validLinks);
      }
    } catch (err) {
      console.error('Error fetching scanned codes:', err);
    }
  };

  // Function to save the scanned QR code to the database
  const saveScanToDatabase = async (userId: string, link: string) => {
    try {
      const { error } = await supabase
        .from('qr_history')
        .insert({ user: userId, link });

      if (error) {
        console.error('Error saving scan to database:', error.message);
      }
    } catch (err) {
      console.error('Error saving scan to database:', err);
    }
  };

  useEffect(() => {
    const fetchAndStartScanner = async () => {
      const user = await getUser(supabase); // Get the logged-in user
      if (!user) {
        setError('User is not logged in');
        return;
      }

      await fetchUserScans(user.id); // Fetch previously scanned QR codes for the user

      const codeReader = new BrowserMultiFormatReader();

      if (videoRef.current) {
        codeReader
          .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
            if (result) {
              const scannedCode = result.getText();

              // Add the new result if it hasn't been scanned already
              if (!scanResults.includes(scannedCode)) {
                setScanResults((prevResults) => [...prevResults, scannedCode]);
                saveScanToDatabase(user.id, scannedCode); // Save the scan to the database
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
    };

    fetchAndStartScanner();

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, [scanResults, supabase]); // Added scanResults and supabase as dependencies

  return (
    <div className="qr-scanner">
      {error && <p className="error">{error}</p>}
      <video ref={videoRef} style={{ width: '100%', height: 'auto' }} />

      <div>
        <h2>Scanned QR Codes:</h2>
        {scanResults.length > 0 ? (
          <ul>
            {scanResults.map((result, index) => (
              <li key={index}>
                <a href={result.startsWith('http') ? result : `http://${result}`}  rel="noopener noreferrer">
                  {result}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No QR codes detected yet.</p>
        )}
      </div>

      <div>
        <h2>Previously Scanned QR Codes:</h2>
        {previousScanResults.length > 0 ? (
          <ul>
            {previousScanResults.map((result, index) => (
              <li key={index}>
                <a href={result.startsWith('http') ? result : `http://${result}`}  rel="noopener noreferrer">
                  {result}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No previously scanned QR codes found.</p>
        )}
      </div>
    </div>
  );
};

export default QrCodeScanner;
