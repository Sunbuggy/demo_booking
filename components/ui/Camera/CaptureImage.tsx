'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';

interface CaptureImageProps {
  onCapture: (image: string) => void;
}

const CaptureImage: React.FC<CaptureImageProps> = ({ onCapture }) => {
  const webcamRef = useRef<Webcam | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        onCapture(imageSrc);
        console.info('Photo taken successfully!');
      }
    }
  }, [onCapture]);

  useEffect(() => {
    const isClient = typeof window !== 'undefined';
    if (isClient) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setPermissionsGranted(isMobile);

      // Check camera permissions
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          setPermissionsGranted(true);
          setIsLoading(false);
          stream.getTracks().forEach((track) => track.stop()); 
        })
        .catch((err) => {
          setError('Camera access denied or not available.');
          setIsLoading(false);
          console.error('Error accessing camera:', err);
        });
    }
  }, []);

  const handleUserMedia = useCallback(() => {
    setIsLoading(false);
  }, []);

  const videoConstraints = {
    facingMode: 'environment',
  };

  return (
    <div className="text-center">
      {error ? (
        <div className="text-red-500">{error}</div>
      ) : capturedImage ? (
        <div>
          <h3>Captured Image:</h3>
          <img
            src={capturedImage}
            alt="Captured"
            className="mx-auto my-4 border border-gray-300"
          />
          <button
            className="m-4 rounded border-0 bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 focus:outline-none"
            onClick={() => setCapturedImage(null)}
          >
            Retake Picture
          </button>
        </div>
      ) : (
        <div>
          {isLoading ? (
            <div>Loading camera...</div>
          ) : (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/png"
                className="border mx-auto my-4"
                onUserMedia={handleUserMedia}
                videoConstraints={videoConstraints}
              />
              <button
                className="m-4 rounded border-0 bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 focus:outline-none"
                onClick={capture}
              >
                Take Picture
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CaptureImage;