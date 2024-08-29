import RedirectButton from '@/components/redirect-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import React from 'react';

const AdminPanel = ({
  display_cost,
  full_name
}: {
  display_cost: boolean;
  full_name: string;
}) => {
  const redirect_path = `?dcos={${true}}`;
  const empty_path = ``;
  return (
    <Card>
      <CardTitle className="mt-3 text-center">Admin Panel</CardTitle>
      <CardContent>
        <p className="text-center text-lg m-2">
          Hello {full_name.split(' ')[0]}
        </p>
        {display_cost ? (
          <div className="flex flex-col gap-2">
            <RedirectButton name="Hide Cost" redirect_path={empty_path} />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <RedirectButton name="Show Cost" redirect_path={redirect_path} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button asChild variant={'ghost'}>
            <Link  href={'/biz/users/admin'}>
              User Management
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPanel;
