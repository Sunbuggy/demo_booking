import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';

const BizLayout = ({ children }: React.PropsWithChildren) => (
  <AntdRegistry>{children}</AntdRegistry>
);

export default BizLayout;
