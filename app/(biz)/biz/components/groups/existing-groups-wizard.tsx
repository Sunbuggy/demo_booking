import React from 'react';
import { Groups } from '../cards/booking-card';
import { Button } from '@/components/ui/button';

interface ExistingGroupsWizardProps {
  groups: Groups[];
}

const ExistingGroupsWizard: React.FC<ExistingGroupsWizardProps> = ({
  groups
}) => {
  return (
    <div>
      <h1>Existing Groups</h1>
      <p>Here are the existing groups</p>
      <div>
        {groups.map((group) => (
          <div key={group.group_name}>
            <Button className="m-3">{group.group_name}</Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExistingGroupsWizard;
