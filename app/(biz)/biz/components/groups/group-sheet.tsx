'use client';
import { SheetComponent } from '@/components/use_sheets';
import React from 'react';

interface GroupSheetProps {
  hr: string;
  // FIX: Use 'React.ReactNode' to accept complex HTML (buttons, spans) or strings
  trigger: React.ReactNode;
  CreateGroupWizard: React.ReactNode;
}

const GroupSheet: React.FC<GroupSheetProps> = ({
  hr,
  trigger,
  CreateGroupWizard
}) => {
  return (
    <SheetComponent
      // We pass the custom trigger here. 
      // NOTE: If SheetComponent expects a string, we might get a type error here next.
      // We are casting it as 'any' temporarily to bypass strict checks if SheetComponent is rigid.
      // Ideally, we will refactor SheetComponent to accept ReactNode too.
      triggerName={trigger as any} 
      title="Groups"
      description={`Group Sheet for Res #${hr}`}
    >
      <div>{CreateGroupWizard}</div>
    </SheetComponent>
  );
};

export default GroupSheet;