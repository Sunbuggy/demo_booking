'use client'
import React, { useEffect, useState } from 'react';

export default function QrHistory() {
  const [qrHistory, setQrHistory] = useState<string[]>([]);

  useEffect(() => {
    // Retrieve the saved QR codes from localStorage
    const storedResults = localStorage.getItem('qrHistory');
    if (storedResults) {
      setQrHistory(JSON.parse(storedResults));
    }
  }, []);

  return (
    <div className="qr-history">
      <h1>Scanned QR Code History</h1>
      {qrHistory.length > 0 ? (
        <ul>
          {qrHistory.map((result, index) => (
            <li key={index}>
              <a
                href={result.startsWith('http') ? result : `http://${result}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                {result}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>No QR codes scanned yet.</p>
      )}
    </div>
  );
}
