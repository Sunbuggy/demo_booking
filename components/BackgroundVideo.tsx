// components/BackgroundVideo.tsx
import React from 'react';

interface BackgroundVideoProps {
  poster?: string; // Optional: URL of a static image to show while loading
  videoSrc: string; // Path to your video file (e.g., /videos/dune-buggy-loop.mp4)
}

const BackgroundVideo: React.FC<BackgroundVideoProps> = ({ videoSrc, poster }) => {
  return (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-[-1]">
      {/* Overlay: Adds a dark tint so your text remains readable on top of the video.
        Adjust 'bg-black/40' to make it darker or lighter.
      */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/40 z-10" />

      <video
        className="w-full h-full object-cover pointer-events-none"
        autoPlay
        muted
        loop
        playsInline
        poster={poster}
      >
        <source src={videoSrc} type="video/mp4" />
        {/* You can add a WebM source here for better compression on supported browsers */}
        {/* <source src={videoSrc.replace('.mp4', '.webm')} type="video/webm" /> */}
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default BackgroundVideo;