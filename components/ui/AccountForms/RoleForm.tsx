'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { updateRole } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RoleForm({ role }: { role: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    // Check if the new role is the same as the old role
    if (e.currentTarget.current_role.value === role) {
      e.preventDefault();
      setIsSubmitting(false);
      return;
    }
    handleRequest(e, updateRole, router);
    setIsSubmitting(false);
  };

  return (
    <Card
      title="Your role"
      description="Please enter your full role, or a display role you are comfortable with."
      footer={
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <Button
            variant="slim"
            type="submit"
            form="roleForm"
            loading={isSubmitting}
          >
            Update role
          </Button>
        </div>
      }
    >
      <div className="mt-8 mb-4 text-xl font-semibold">
        <form id="roleForm" onSubmit={(e) => handleSubmit(e)}>
          <input
            type="text"
            name="current_role"
            className="w-1/2 p-3 rounded-md bg-zinc-800"
            defaultValue={role}
            placeholder="Your role"
            maxLength={64}
          />
        </form>
      </div>
    </Card>
  );
}
