'use client';

import { useEffect, useState } from 'react';

interface EmailImage {
  filename: string;
  data: string;
}

export default function Home() {
  const [images, setImages] = useState<EmailImage[]>([]);

  useEffect(() => {
    fetch('/api/emails')
      .then((res) => res.json())
      .then((data) => setImages(data.images))
      .catch(console.error);
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Email Images</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div key={index} className="border rounded-lg overflow-hidden">
            <img
              src={image.data}
              alt={image.filename}
              className="w-full h-48 object-cover"
            />
            <p className="p-2 text-sm truncate">{image.filename}</p>
          </div>
        ))}
      </div>
    </main>
  );
}