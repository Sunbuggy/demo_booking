// app/dashboard/layout.tsx
import React, { Suspense } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import Loading from './loading';
import 'react-big-calendar/lib/css/react-big-calendar.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </AntdRegistry>
  );
}
