'use client';

import { useState, useEffect } from 'react';
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

export default function QRCodeGenerator({
  defUrl = '',
  defTopText = '',
  defBottomText = '',
  defCount = '4',
  hidden
}: {
  defUrl?: string;
  defTopText?: string;
  defBottomText?: string;
  defCount?: '1' | '2' | '4';
  hidden?: boolean;
}) {
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: defUrl,
      topText: defTopText,
      bottomText: defBottomText,
      count: defCount || '4'
    }
  });

  const onSubmit = async (values: FormData) => {
    console.log('onSubmit Run');
    if (values.url) {
      const qrCodeDataUrl = await generateQRCode(values.url);
      setQrCodeData(qrCodeDataUrl);
    }
  };

  useEffect(() => {
    if (hidden) {
      onSubmit(form.getValues());
    }
  }, [hidden]);

  return (
    <div className="space-y-8">
      <QRCodeForm form={form} onSubmit={onSubmit} hide={hidden} />
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
