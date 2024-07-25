'use client';

import React from 'react';
import { Button } from './ui/button';
import { redirect, usePathname } from 'next/navigation';

const RedirectButton = ({
  name,
  redirect_path
}: {
  name: string;
  redirect_path: string;
}) => {
  const path = usePathname();
  function clickAction() {
    console.log('Redirecting to:', `${path}/${redirect_path}`);
    return redirect(`${path}/${redirect_path}`);
  }
  return <Button onClick={() => clickAction()}>{name}</Button>;
};

export default RedirectButton;
