'use client';

import RedirectButton from '@/components/redirect-button';
import { DollarSign } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const ToggleShowRev = () => {
  const searchParams = useSearchParams();
  const [dcos, setDcos] = useState(searchParams.get('dcos') === 'true');

  useEffect(() => {
    const handleRouteChange = () => {
      setDcos(searchParams.get('dcos') === 'true');
    };

    handleRouteChange(); // Initial check
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [searchParams]);

  const redirect_path = dcos ? '' : '?dcos=true';

  return (
    <div>
      <RedirectButton
        name={
          <div>
            <DollarSign className={dcos ? 'text-green-500' : 'text-gray-500'} />
          </div>
        }
        redirect_path={redirect_path}
      />
    </div>
  );
};

export default ToggleShowRev;
