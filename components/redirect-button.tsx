'use client';

import React from 'react';
import { Button } from './ui/button';
import { usePathname, useRouter } from 'next/navigation';

const RedirectButton = ({
  name,
  redirect_path
}: {
  name: string | React.ReactNode;
  redirect_path: string;
}) => {
  const path = usePathname();
  const router = useRouter();

  function clickAction() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const isBookSite =
      process.env.NEXT_PUBLIC_URL === 'https://book.sunbuggy.com';

    if (isBookSite) {
      return router.push(`/${redirect_path}`);
    }

    let baseUrl = '';
    try {
      // Try to get the host from NEXT_PUBLIC_SITE_URL
      baseUrl = new URL(siteUrl).host;
    } catch (error) {
      console.warn('Invalid NEXT_PUBLIC_SITE_URL, using fallback method');
      // Fallback: use the current window location
      baseUrl = window.location.host;
    }

    // Remove the baseUrl from the current path if it exists
    const currentPath = path.replace(new RegExp(`^/${baseUrl}`), '');

    // Construct the new URL without duplicating the base URL
    const newUrl = `/${currentPath}/${redirect_path}`.replace(/\/+/g, '/');

    router.push(newUrl);
  }

  return (
    <Button variant="ghost" size="icon" onClick={clickAction}>
      {name}
    </Button>
  );
};

export default RedirectButton;
