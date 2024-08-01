'use client';

import { Card } from '@/components/ui/card';
import React, { useState } from 'react';

const PanelSelector = (props: {
  admin: React.ReactNode;
  torch: React.ReactNode;
  role: number;
}) => {
  const [showPanels, setShowPanels] = useState({
    admin: false,
    torch: false
  });

  const handleCheckboxChange =
    (panel: 'admin' | 'torch') => (e: React.ChangeEvent<HTMLInputElement>) => {
      setShowPanels((prev) => ({ ...prev, [panel]: e.target.checked }));
    };

  return (
    <>
      <Card className="flex p-5 gap-5">
        {props.role > 899 && (
          <>
            <input
              checked={showPanels.admin}
              type="checkbox"
              id="admin"
              name="admin"
              onChange={handleCheckboxChange('admin')}
            />
            <label htmlFor="admin"> Show Admin</label>
          </>
        )}
        {props.role > 449 && (
          <>
            <input
              checked={showPanels.torch}
              type="checkbox"
              id="torch"
              name="torch"
              onChange={handleCheckboxChange('torch')}
            />
            <label htmlFor="torch"> Show Torch</label>
          </>
        )}
      </Card>

      {showPanels.admin && props.role > 899 && <div>{props.admin}</div>}
      {showPanels.torch && props.role > 449 && <div>{props.torch}</div>}
    </>
  );
};

export default PanelSelector;
