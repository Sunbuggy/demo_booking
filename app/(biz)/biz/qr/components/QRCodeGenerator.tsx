'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import QRCodeForm from './QRCodeForm';
import QRCodeDisplay from './QRCodeDisplay';

const formSchema = z.object({
  url: z.string().url(),
  topText: z.string().max(50, 'Top text must be 50 characters or less'),
  bottomText: z.string().max(50, 'Bottom text must be 50 characters or less'),
  count: z.enum(['1', '2', '4'])
});

export type FormData = z.infer<typeof formSchema>;

export default function QRCodeGenerator() {
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      topText: '',
      bottomText: '',
      count: '1'
    }
  });

  const onSubmit = async (values: FormData) => {
    if (values.url) {
      const qrCodeDataUrl = await generateQRCode(values.url);
      setQrCodeData(qrCodeDataUrl);
    }
  };

  return (
    <div className="space-y-8">
      <QRCodeForm form={form} onSubmit={onSubmit} />
      {qrCodeData && (
        <QRCodeDisplay qrCodeData={qrCodeData} formData={form.getValues()} />
      )}
    </div>
  );
}

async function generateQRCode(url: string): Promise<string> {
  const QrCode = (await import('qrcode')).default;
  return QrCode.toDataURL(url, { width: 1000, margin: 1 });
}
