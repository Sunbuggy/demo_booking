import React, { Suspense } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import Loading from './loading';

const BizLayout = ({ children }: React.PropsWithChildren) => (
  <AntdRegistry>{children}</AntdRegistry>
);

export default BizLayout;
