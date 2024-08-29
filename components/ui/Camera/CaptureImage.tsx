import React, { useState, useCallback, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';

interface CaptureImageProps {
  onCapture: (image: string) => void;
}

const CaptureImage: React.FC<CaptureImageProps> = ({ onCapture }) => {
  const webcamRef = useRef<Webcam | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        onCapture(imageSrc);
        setCaptureSuccess(true);

        // Success message
        console.log('Photo taken successfully!');
      }
    }
  }, [webcamRef, onCapture]);

  useEffect(() => {
    const isClient = typeof window !== 'undefined';
    if (isClient) {
      setPermissionsGranted(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }
  }, []);

  const handleUserMedia = useCallback((stream: MediaStream) => {
    setPermissionsGranted(!!stream);
  }, []);

  const videoConstraints = {
    facingMode: 'environment',
  };

  return (
    <div className="text-center">
      {capturedImage ? (
        <div>
          <h3>Captured Image:</h3>
          <img src={capturedImage} alt="Captured" className="mx-auto my-4 border border-gray-300" />
          <button
            className="m-4 rounded border-0 bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 focus:outline-none"
            onClick={() => setCapturedImage(null)}
          >
            Retake Picture
          </button>
        </div>
      ) : (
        <div>
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
        </div>
      )}
    </div>
  );
};

export default CaptureImage;

