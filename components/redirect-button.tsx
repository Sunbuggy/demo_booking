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
    return router.push(
      `${process.env.NEXT_PUBLIC_SITE_URL}/${path}/${redirect_path}`
    );
  }
  return (
    <Button variant="ghost" size="sm" onClick={() => clickAction()}>
      {name}
    </Button>
  );
};

export default RedirectButton;
