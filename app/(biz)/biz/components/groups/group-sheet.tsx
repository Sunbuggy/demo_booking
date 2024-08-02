'use client';
import { SheetComponent } from '@/components/use_sheets';
import React from 'react';
import { Button } from '@/components/ui/button';

interface GroupSheetProps {
  res_id: number;
  name: string;
  ExistingGroupsWizard: React.ReactNode;
  CreateGroupWizard: React.ReactNode;
  assignedGroups: string[];
}

const GroupSheet: React.FC<GroupSheetProps> = ({
  res_id,
  name,
  ExistingGroupsWizard,
  CreateGroupWizard,
  assignedGroups
}) => {
  const [showCreateGroup, setShowCreateGroup] = React.useState(false);
  const [showExistingGroups, setShowExistingGroups] = React.useState(false);
  const assignedGroupsExist = assignedGroups.length > 0;
  return (
    <SheetComponent
      triggerName={`${assignedGroups.length > 0 ? assignedGroups.map((itm) => `${itm},`) : 'GR?'}`}
      title="Groups"
      description={`Group Sheet for Res #${res_id} (${name})`}
      assignedGroupsExist={assignedGroupsExist}
    >
      <div>
        {!showCreateGroup && !showExistingGroups && (
          <>
            <Button
              onClick={() => {
                setShowCreateGroup(true);
              }}
            >
              &rarr; Create a New Group
            </Button>
            <br />
            or
            <br />
          </>
        )}
        {showCreateGroup && (
          <>
            {CreateGroupWizard}
            <Button
              className="mt-2"
              onClick={() => {
                setShowCreateGroup(false);
              }}
            >
              &larr; Close Wizard
            </Button>
          </>
        )}

        {!showExistingGroups && !showCreateGroup && (
          <>
            <Button
              onClick={() => {
                setShowExistingGroups(true);
              }}
            >
              &rarr; Assign To Existing Group{' '}
            </Button>
            <br />
          </>
        )}
        {showExistingGroups && (
          <>
            {ExistingGroupsWizard}
            <Button
              onClick={() => {
                setShowExistingGroups(false);
              }}
            >
              &larr; Close Wizard
            </Button>
          </>
        )}
      </div>
    </SheetComponent>
  );
};

export default GroupSheet;
