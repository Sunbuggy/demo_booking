import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

const QrCodeScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanResults, setScanResults] = useState<string[]>([]); // Store multiple results
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    if (videoRef.current) {
      codeReader
        .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
          if (result) {
            const scannedCode = result.getText();

            // Add the new result if it hasn't been scanned already
            if (!scanResults.includes(scannedCode)) {
              setScanResults((prevResults) => [...prevResults, scannedCode]);
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
  }, [scanResults]); // Added scanResults as a dependency

  return (
    <div className="qr-scanner">
      {/* <h1>QR Code Scanner</h1> */}
      {error && <p className="error">{error}</p>}
      <video ref={videoRef} style={{ width: '100%', height: 'auto' }} />

      <div>
        <h2>Scanned QR Codes:</h2>
        {scanResults.length > 0 ? (
          <ul>
            {scanResults.map((result, index) => (
              <li key={index}>
                {/* Render the result as a clickable link */}
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
    </div>
  );
};

export default QrCodeScanner;
