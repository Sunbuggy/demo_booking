import RedirectButton from '@/components/redirect-button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import React from 'react';

const AdminPanel = ({ display_cost }: { display_cost: boolean }) => {
  return (
    <Card>
      <CardTitle className="mt-3 text-center">Admin Panel</CardTitle>
      <CardContent>
        {display_cost ? (
          <p>Cost is displayed</p>
        ) : (
          <div className="flex flex-col gap-2">
            <RedirectButton name="Show Cost" redirect_path="&dcos={true}" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminPanel;
