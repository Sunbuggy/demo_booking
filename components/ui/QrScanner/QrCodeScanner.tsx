import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

interface QrCodeScannerProps {
  onScanSuccess: (scannedCode: string) => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScanSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    if (videoRef.current) {
      codeReader
        .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
          if (result) {
            const scannedCode = result.getText();
            onScanSuccess(scannedCode); // Pass the scanned result to parent component
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

    // Cleanup function to stop the camera when the component unmounts
    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, [onScanSuccess]); // Only re-run if the scan success handler changes

  return (
    <div className="qr-scanner">
      {error && <p className="error">{error}</p>}
      <video ref={videoRef} style={{ width: '100%', height: 'auto' }} />
    </div>
  );
};

export default QrCodeScanner;
