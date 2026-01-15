import React from 'react';
// IMPORT THE LISTENER WE JUST FIXED
import RealtimeGroupsListener from './vegas/components/realtime-groups-listener';

export default function BizLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      {/* Mount the listener here so it runs globally for this section */}
      <RealtimeGroupsListener />
      {children}
    </section>
  );
}