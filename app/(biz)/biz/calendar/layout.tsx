import React, { Suspense } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import Loading from './loading';

/**
 * @file /app/(biz)/biz/layout.tsx
 * @description Layout for the business logic pages.
 * Updated: Semantic Theming Applied (v1.0)
 */

const BizLayout = ({ children }: React.PropsWithChildren) => (
  <AntdRegistry>
    {/* SEMANTIC OVERHAUL:
      Wrapped children in a div that explicitly sets the semantic background and text colors.
      This ensures the entire /biz section respects Light/Dark mode defaults 
      even if a specific child page doesn't define its own container.
    */}
    <div className="min-h-screen w-full bg-background text-foreground">
      {children}
    </div>
  </AntdRegistry>
);

export default BizLayout;