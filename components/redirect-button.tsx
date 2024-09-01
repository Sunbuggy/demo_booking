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
    console.log(path);
    console.log(redirect_path);
    const pathUrl = process.env.NEXT_PUBLIC_SITE_URL!.replace('https://', '');
    return router.push(
      `${process.env.NEXT_PUBLIC_SITE_URL}/${path.replace(pathUrl, '')}/${redirect_path}`
    );
  }
  return (
    <Button variant="ghost" size="sm" onClick={() => clickAction()}>
      {name}
    </Button>
  );
};

export default RedirectButton;
