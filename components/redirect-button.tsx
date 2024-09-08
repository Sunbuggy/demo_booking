'use client';

import React from 'react';
import { Button } from './ui/button';
import { usePathname, useRouter } from 'next/navigation';

const RedirectButton = ({
  name,
  redirect_path
}: {
  name: string;
  redirect_path: string;
}) => {
  const path = usePathname();
  const router = useRouter();

  function clickAction() {
    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      console.error("NEXT_PUBLIC_SITE_URL is not defined.");
      return;
    }
    const baseUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL).host;

    // If the path already contains the base URLremove it
    const currentPath = path.replace(new RegExp(`^/${baseUrl}`), '');

    console.log("Current Path:", path);
    console.log("Redirect Path:", redirect_path);
    if(process.env.NEXT_PUBLIC_URL === 'book.sunbuggy.com'){
      router.push(`/${redirect_path}`);
    }

    // Construct the new URL without duplicating the base URL
    const newUrl = `/${currentPath}/${redirect_path}`.replace(/\/+/g, '/');

    router.push(newUrl);
  }

  return (
    <Button variant="ghost" size="sm" onClick={clickAction}>
      {name}
    </Button>
  );
};

export default RedirectButton;
