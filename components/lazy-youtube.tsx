'use client';
import React, { useState, useEffect, useRef } from 'react';

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
  const videoRef = useRef(null);

  useEffect(() => {
    const currentVideoRef = videoRef.current;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setLoad(true);
        observer.disconnect();
      }
    });

    if (currentVideoRef) {
      observer.observe(currentVideoRef);
    }

    return () => {
      if (currentVideoRef) {
        observer.unobserve(currentVideoRef);
      }
    };
  }, []);

  return (
    <div
      ref={videoRef}
      className="relative w-full pt-[56.25%]" // 16:9 aspect ratio
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
          Loading...
        </div>
      )}
    </div>
  );
};

export default LazyYoutube;