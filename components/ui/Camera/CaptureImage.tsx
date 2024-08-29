import React, { useState, useCallback, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';

// Define the props interface for the component
interface CaptureImageProps {
  // Function that will be called when an image is captured
  onCapture: (image: string) => void;
}

// CaptureImage component definition using React.FC with the specified props
const CaptureImage: React.FC<CaptureImageProps> = ({ onCapture }) => {
  // useRef is used to keep a reference to the Webcam component
  const webcamRef = useRef<Webcam | null>(null);

  // useState hook to store the captured image as a base64 string
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // useState to track if camera permissions have been granted
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // useState to indicate if the image capture was successful
  const [captureSuccess, setCaptureSuccess] = useState(false);

  // Function to capture an image from the webcam
  const capture = useCallback(() => {
    // Check if the webcam reference is available
    if (webcamRef.current) {
      // Capture a screenshot from the webcam and store it as a base64 string
      const imageSrc = webcamRef.current.getScreenshot();

      // If an image was captured, store it in state and call the onCapture prop
      if (imageSrc) {
        setCapturedImage(imageSrc); // Store the captured image
        onCapture(imageSrc); // Pass the image to the parent component
        setCaptureSuccess(true); // Mark capture as successful

        // Log a success message in the console
        console.log('Photo taken successfully!');
      }
    }
  }, [webcamRef, onCapture]); // Dependencies: re-create the function if these change

  // Effect hook to detect whether the client is a mobile device and set permissions accordingly
  useEffect(() => {
    const isClient = typeof window !== 'undefined'; // Ensure code is only executed on the client side
    if (isClient) {
      // Check if the user agent corresponds to a mobile device
      setPermissionsGranted(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }
  }, []); // Empty dependency array: this effect runs once on component mount

  // Function to handle user media stream (when the webcam is accessed)
  const handleUserMedia = useCallback((stream: MediaStream) => {
    // Update permissionsGranted state when media stream is available
    setPermissionsGranted(!!stream); // Convert stream to boolean and update state
  }, []);

  // Constraints for the video stream; uses the back camera on mobile devices
  const videoConstraints = {
    facingMode: 'environment', // Use back camera on mobile devices
  };

  // The return statement defines the UI of the component
  return (
    <div className="text-center">
      {/* If an image has been captured, display it */}
      {capturedImage ? (
        <div>
          <h3>Captured Image:</h3>
          {/* Show the captured image */}
          <img src={capturedImage} alt="Captured" className="mx-auto my-4 border border-gray-300" />
          {/* Button to reset the captured image, allowing the user to retake the picture */}
          <button
            className="m-4 rounded border-0 bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 focus:outline-none"
            onClick={() => setCapturedImage(null)} // Reset the captured image when clicked
          >
            Retake Picture
          </button>
        </div>
      ) : (
        // If no image has been captured, show the webcam and the capture button
        <div>
          <Webcam
            audio={false} // Disable audio capture
            ref={webcamRef} // Attach the webcam reference
            screenshotFormat="image/png" // Format for the captured image
            className="border mx-auto my-4" // Styling for the webcam preview
            onUserMedia={handleUserMedia} // Function to call when the webcam is accessed
            videoConstraints={videoConstraints} // Use specified video constraints
          />
          {/* Button to trigger image capture */}
          <button
            className="m-4 rounded border-0 bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 focus:outline-none"
            onClick={capture} // Capture the image when clicked
          >
            Take Picture
          </button>
        </div>
      )}
    </div>
  );
};

export default CaptureImage;
