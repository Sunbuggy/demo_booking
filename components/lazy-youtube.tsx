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
    <div ref={videoRef}>
      {load ? (
        <iframe
          className="rounded-md"
          width="100%"
          height="315"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay}&mute=1&rel=0&modestbranding=1&showinfo=0&controls=0&playlist=${videoId}&loop=1&list=${playlistId}`}
          //   src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1&showinfo=0&controls=0&playlist=${videoId}&loop=1`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default LazyYoutube;
