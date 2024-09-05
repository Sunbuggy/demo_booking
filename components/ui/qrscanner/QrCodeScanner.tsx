import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

const QrCodeScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanResults, setScanResults] = useState<string[]>([]); // Store multiple results
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  // Load previous QR codes from localStorage
  useEffect(() => {
    const storedResults = localStorage.getItem('qrHistory');
    if (storedResults) {
      setScanResults(JSON.parse(storedResults));
    }
  }, []);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    if (videoRef.current) {
      codeReader
        .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
          if (result) {
            const scannedCode = result.getText();

            // Add the new result if it hasn't been scanned already
            setScanResults((prevResults) => {
              if (!prevResults.includes(scannedCode)) {
                const updatedResults = [...prevResults, scannedCode];
                
                // Save updated scan results to localStorage
                localStorage.setItem('qrHistory', JSON.stringify(updatedResults));
                
                return updatedResults;
              }
              return prevResults;
            });
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
  }, []); // Removed scanResults dependency to prevent re-initialization

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
                <a
                  href={result.startsWith('http') ? result : `http://${result}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
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
