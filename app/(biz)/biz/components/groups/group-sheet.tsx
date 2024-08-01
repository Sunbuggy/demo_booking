'use client';
import { SheetComponent } from '@/components/use_sheets';
import React from 'react';
import CreateGroupWizard from './create-group-wizard';
import { Button } from '@/components/ui/button';
import ExistingGroupsWizard from './existing-groups-wizard';
import { Groups } from '../cards/booking-card';

interface GroupSheetProps {
  res_id: number;
  name: string;
  hour: string;
  fleet: {
    [x: string]: number;
  };
  groups: Groups[];
}

const GroupSheet: React.FC<GroupSheetProps> = ({
  res_id,
  name,
  hour,
  fleet,
  groups
}) => {
  const [showCreateGroup, setShowCreateGroup] = React.useState(false);
  const [showExistingGroups, setShowExistingGroups] = React.useState(false);
  console.log(groups);

  return (
    <SheetComponent
      triggerName="GR?"
      title="Groups"
      description={`Group Sheet for Res #${res_id} (${name})`}
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
            <CreateGroupWizard hour={Number(hour)} fleet={fleet} />
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
            <ExistingGroupsWizard groups={groups} />
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
