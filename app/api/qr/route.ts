import { ImageResponse } from '@vercel/og';
import QRCode from 'qrcode';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const count = parseInt(searchParams.get('count') || '1', 10);
  const topText = searchParams.get('topText') || '';
  const bottomText = searchParams.get('bottomText') || '';

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
    const padding = 10;
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
            backgroundColor: 'white',
            fontFamily: 'sans-serif'
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
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: `${padding}px`,
                        paddingLeft: `${522}px`,
                        paddingRight: `${padding}px`,
                        marginBottom: '10px'
                      },
                      children: [
                        topText && {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '24px',
                              fontWeight: 'bold',
                              marginBottom: '5px',
                              textAlign: 'center'
                            },
                            children: topText
                          }
                        },
                        {
                          type: 'img',
                          props: {
                            src: `data:image/svg+xml;base64,${Buffer.from(qrCodeSvg).toString('base64')}`,
                            width: qrCodeSize,
                            height: qrCodeSize
                          }
                        },
                        bottomText && {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '24px',
                              fontWeight: 'bold',
                              marginTop: '5px',
                              textAlign: 'center'
                            },
                            children: bottomText
                          }
                        }
                      ].filter(Boolean)
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
