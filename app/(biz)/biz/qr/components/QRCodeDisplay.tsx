'use client';

import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FormData } from './QRCodeGenerator';

interface QRCodeDisplayProps {
  qrCodeData: string;
  formData: FormData;
}

export default function QRCodeDisplay({
  qrCodeData,
  formData
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        const backgroundImg = new Image();

        img.onload = () => {
          backgroundImg.onload = () => {
            const DPI = 300;
            const A4_WIDTH = 8.5 * DPI;
            const A4_HEIGHT = 11 * DPI;
            const LABEL_DIAMETER = 4 * DPI;
            const SIDE_MARGIN =
              (A4_WIDTH - (LABEL_DIAMETER * 2 + 0.25 * DPI)) / 2;
            const TOP_MARGIN =
              (A4_HEIGHT - (LABEL_DIAMETER * 2 + 0.25 * DPI)) / 2;
            const HORIZONTAL_GAP = 0.25 * DPI;
            const VERTICAL_GAP = 0.25 * DPI;

            canvas.width = A4_WIDTH;
            canvas.height = A4_HEIGHT;

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const positions = [
              {
                x: SIDE_MARGIN + LABEL_DIAMETER / 2,
                y: TOP_MARGIN + LABEL_DIAMETER / 2
              },
              {
                x:
                  SIDE_MARGIN +
                  LABEL_DIAMETER +
                  HORIZONTAL_GAP +
                  LABEL_DIAMETER / 2,
                y: TOP_MARGIN + LABEL_DIAMETER / 2
              },
              {
                x: SIDE_MARGIN + LABEL_DIAMETER / 2,
                y:
                  TOP_MARGIN +
                  LABEL_DIAMETER +
                  VERTICAL_GAP +
                  LABEL_DIAMETER / 2
              },
              {
                x:
                  SIDE_MARGIN +
                  LABEL_DIAMETER +
                  HORIZONTAL_GAP +
                  LABEL_DIAMETER / 2,
                y:
                  TOP_MARGIN +
                  LABEL_DIAMETER +
                  VERTICAL_GAP +
                  LABEL_DIAMETER / 2
              }
            ];

            positions.forEach(({ x, y }) => {
              ctx.save();
              ctx.beginPath();
              ctx.arc(x, y, LABEL_DIAMETER / 2, 0, Math.PI * 2); // Draw the circle again for clipping
              ctx.clip();
              ctx.drawImage(
                backgroundImg,
                x - LABEL_DIAMETER / 2,
                y - LABEL_DIAMETER / 2,
                LABEL_DIAMETER,
                LABEL_DIAMETER
              );
              ctx.restore();

              const qrSize = LABEL_DIAMETER * 0.4;
              const textHeight = LABEL_DIAMETER * 0.25;
              const margin = LABEL_DIAMETER * 0.02;
              const totalContentHeight =
                textHeight + margin + qrSize + margin + textHeight;
              const contentStartY = y - totalContentHeight / 2;

              ctx.fillStyle = 'black';
              ctx.textAlign = 'center';
              ctx.font = `bold ${textHeight}px sans-serif`;

              // Measure top text width
              const topTextWidth = ctx.measureText(formData.topText).width;
              const topTextPadding = 5;
              ctx.fillStyle = 'white';
              ctx.fillRect(
                x - topTextWidth / 2 - topTextPadding,
                contentStartY,
                topTextWidth + 2 * topTextPadding,
                textHeight
              );

              // Measure bottom text width
              const bottomTextWidth = ctx.measureText(
                formData.bottomText
              ).width;
              const bottomTextPadding = 5;
              ctx.fillRect(
                x - bottomTextWidth / 2 - bottomTextPadding,
                contentStartY + textHeight + margin + qrSize + margin,
                bottomTextWidth + 2 * bottomTextPadding,
                textHeight
              );

              ctx.fillStyle = 'black';
              ctx.fillText(formData.topText, x, contentStartY + textHeight);
              ctx.drawImage(
                img,
                x - qrSize / 2,
                contentStartY + textHeight + margin,
                qrSize,
                qrSize
              );
              ctx.fillText(
                formData.bottomText,
                x,
                contentStartY +
                  textHeight +
                  margin +
                  qrSize +
                  margin +
                  textHeight -
                  55
              );
            });
          };
          backgroundImg.src = '/sb-lg-yl.png';
        };
        img.src = qrCodeData;
      }
    }
  }, [qrCodeData, formData]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'qr-codes.png';
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const handlePrint = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code(s)</title>
            <style>
              @page {
                size: Letter; /* Set page size to Letter */
                margin: 0;    /* Remove default margins */
              }
              body {
                margin: 0;
                padding: 0;
              }
              img {
                width: 100%;
                height: auto;
                display: block;
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="space-y-4">
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: '210 / 297'
        }}
      />
      <Button onClick={handleDownload} className="w-full">
        Download QR Code(s)
      </Button>
      <Button onClick={handlePrint} className="w-full">
        Print QR Code(s)
      </Button>
    </div>
  );
}
