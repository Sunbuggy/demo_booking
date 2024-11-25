import { ImageResponse } from '@vercel/og';
import QRCode from 'qrcode';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const count = parseInt(searchParams.get('count') || '1', 10);

  if (!url) {
    return new Response('Missing URL parameter', { status: 400 });
  }

  if (![1, 2, 3].includes(count)) {
    return new Response('Invalid count parameter', { status: 400 });
  }

  try {
    const qrCodeSvg = await QRCode.toString(url, {
      type: 'svg',
      width: 1000,
      margin: 1
    });

    const qrCodeSize = count === 2 ? 350 : count === 3 ? 250 : 450;
    const padding = 20;
    const columns = count === 2 ? 1 : 2;

    return new ImageResponse(
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            width: '210mm',
            height: '297mm',
            padding: `${padding}px`,
            backgroundColor: 'white'
          },
          children: [
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%'
                },
                children: Array(count)
                  .fill(null)
                  .map((_, index) => ({
                    type: 'div',
                    props: {
                      key: index,
                      style: {
                        width: `${100 / columns}%`,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: `${padding}px`,
                        paddingLeft: `${padding + 500}px` // Added extra left padding
                      },
                      children: {
                        type: 'img',
                        props: {
                          src: `data:image/svg+xml;base64,${Buffer.from(qrCodeSvg).toString('base64')}`,
                          width: qrCodeSize,
                          height: qrCodeSize
                        }
                      }
                    }
                  }))
              }
            }
          ]
        }
      } as React.ReactElement,
      {
        width: 210 * 3.78, // Convert mm to pixels (assuming 96 DPI)
        height: 297 * 3.78
      }
    );
  } catch (error) {
    console.error('Error generating QR code:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error generating QR code: ${errorMessage}`, {
      status: 500
    });
  }
}
