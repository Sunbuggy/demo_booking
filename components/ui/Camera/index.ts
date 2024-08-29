
export { default } from "./CaptureImage";

// {capturedImage ? (
//     <div className="text-center">
//       <h3>Captured Image:</h3>
//       <img src={capturedImage} alt="Captured" className="mx-auto my-4 border border-gray-300" />
//       <button
//         className="m-4 rounded border-0 bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 focus:outline-none"
//         onClick={() => setCapturedImage(null)}
//       >
//         Retake Picture
//       </button>
//     </div>
//   ) : (
//     <CaptureImage onCapture={handleCapture} />
//   )}