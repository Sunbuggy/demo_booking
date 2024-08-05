'use client';
import { SheetComponent } from '@/components/use_sheets';
import React from 'react';

interface GroupSheetProps {
  hr: string;
  trigger: string;
  CreateGroupWizard: React.ReactNode;
}

const GroupSheet: React.FC<GroupSheetProps> = ({
  hr,
  trigger,

  CreateGroupWizard
}) => {
  return (
    <SheetComponent
      triggerName={trigger}
      title="Groups"
      description={`Group Sheet for Res #${hr}`}
    >
      <div>{CreateGroupWizard}</div>
    </SheetComponent>
  );
};

export default GroupSheet;
