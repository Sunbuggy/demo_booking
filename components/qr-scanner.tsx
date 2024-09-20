'use client';
import { useZxing } from 'react-zxing';
import React from 'react';
import { createClient } from '@/utils/supabase/client';
import { getVehicleIdFromName } from '@/utils/supabase/queries';
import { useRouter } from 'next/navigation';
import { SheetClose } from './ui/sheet';

export const BarcodeScanner = () => {
  const supabase = createClient();
  const [result, setResult] = React.useState('');
  const [closeCamera, setCloseCamera] = React.useState(false);
  const router = useRouter();
  const { ref } = useZxing({
    paused: closeCamera,
    onDecodeResult(result) {
      setResult(result.getText());
      //   close the camera after scanning
      setCloseCamera(true);
    }
  });

  React.useEffect(() => {
    if (result && result.includes('/fleet/')) {
      const veh_name = result.split('/fleet/')[1].toLowerCase();
      getVehicleIdFromName(supabase, veh_name).then((res) => {
        const id = res[0].id as string;
        router.push(`/biz/vehicles/${id}`);
        setResult(`/biz/vehicles/${id}`);
      });
    }
  }, [result]);

  return (
    <>
      <video ref={ref} />
      {/* if paused have the ability to erase result and restart the camera with a button */}
      {result && !result.includes('biz/vehicles') && (
        <>
          <p className="mb-5">
            <span className="underline text-amber-600">{result}</span>
          </p>
          <button
            onClick={() => {
              setResult('');
              setCloseCamera(false);
            }}
          >
            Clear
          </button>
        </>
      )}
      {result && result.includes('biz/vehicles') && (
        <SheetClose>
          {/* left arrow */}
          &larr;Go To Vehicle
        </SheetClose>
      )}
    </>
  );
};
