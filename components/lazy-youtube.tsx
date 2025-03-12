'use client';
import React, { useState, useRef, useEffect } from 'react';

const LazyYoutube = ({
  videoId,
  playlistId,
  autoplay = 0
}: {
  videoId: string;
  playlistId?: string;
  autoplay?: number;
}) => {
  const [load, setLoad] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  // Handle click on the facade to load the iframe
  const handleFacadeClick = () => {
    setLoad(true);
  };

  // Preload the iframe source when the component mounts
  useEffect(() => {
    if (load) {
      const iframeSrc = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay}&mute=1&rel=0&modestbranding=1&showinfo=0&controls=0&playlist=${videoId}&loop=1&list=${playlistId}`;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = iframeSrc;
      link.as = 'document';
      document.head.appendChild(link);
    }
  }, [load, videoId, autoplay, playlistId]);

  return (
    <div
      ref={videoRef}
      className="relative w-full pt-[56.25%] cursor-pointer" // 16:9 aspect ratio
      onClick={handleFacadeClick}
    >
      {load ? (
        <iframe
          className="absolute inset-0 w-full h-full rounded-md"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay}&mute=1&rel=0&modestbranding=1&showinfo=0&controls=0&playlist=${videoId}&loop=1&list=${playlistId}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 rounded-md">
          {/* YouTube Thumbnail as Facade */}
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} // Use a smaller thumbnail size
            alt="YouTube video thumbnail"
            className="absolute inset-0 w-full h-full object-cover rounded-md"
            loading="eager" // Force eager loading for above-the-fold images
            fetchPriority="high" // Prioritize fetching this image
          />
          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyYoutube;