'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

const PageSelector = ({ availablePages, currentPage }: { availablePages: string[]; currentPage: string }) => {
  const [selectedPage, setSelectedPage] = useState(currentPage);
  const supabase = createClient();
  const router = useRouter();

  const handlePageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newHomepage = event.target.value;
    setSelectedPage(newHomepage);

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update({ homepage: newHomepage }) 
      .eq('id', user.id);

    if (error) {
      console.error('Failed to update homepage:', error);
      return;
    }

    console.log('homepage updated to: ', newHomepage);
    router.refresh(); // Refresh the page to reflect the change
  };

  return (
    <div>
      <label className='p-4' htmlFor="homepage-selector">Select your homepage:</label>
      <select
        id="homepage-selector"
        value={selectedPage}
        onChange={handlePageChange}
        className="mt-2 p-2 border rounded"
      >
        {availablePages.map((page) => (
          <option key={page} value={page}>
            {page}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PageSelector;
