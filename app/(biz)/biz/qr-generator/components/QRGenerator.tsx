'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function QRGenerator() {
  const [url, setUrl] = useState('');
  const [count, setCount] = useState('2');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const generateQRCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    const qrCodeUrl = `/api/qr?url=${encodeURIComponent(url)}&count=${count}`;
    setQrCodeUrl(qrCodeUrl);
  };

  const handlePrint = () => {
    const printWindow = window.open(qrCodeUrl, '_blank');
    printWindow?.addEventListener('load', () => {
      printWindow.print();
    });
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={generateQRCode} className="space-y-4">
        <div>
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL"
            required
          />
        </div>
        <div>
          <Label>QR Codes per Page</Label>
          <RadioGroup
            value={count}
            onValueChange={setCount}
            className="flex space-x-4"
          >
            {['1', '2', '3'].map((value) => (
              <div key={value} className="flex items-center space-x-2">
                <RadioGroupItem value={value} id={`count-${value}`} />
                <Label htmlFor={`count-${value}`}>{value}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <Button type="submit" className="w-full">
          Generate QR Code
        </Button>
      </form>
      {qrCodeUrl && (
        <div className="mt-8 space-y-4">
          <div className="bg-white p-4 border rounded-lg shadow-sm">
            <img
              src={qrCodeUrl}
              alt="Generated QR Codes"
              className="w-full h-auto object-contain"
              style={{ aspectRatio: '210 / 297' }}
            />
          </div>
          <Button onClick={handlePrint} className="w-full">
            Print QR Codes
          </Button>
        </div>
      )}
    </div>
  );
}
