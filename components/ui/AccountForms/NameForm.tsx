'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { updateName, updatePhone } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NameForm({
  userName,
  user_role,
  phone
}: {
  userName: string;
  user_role: number;
  phone: string | null | undefined;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    // Check if the new name is the same as the old name and the new phone is the same as the old phone
    if (
      e.currentTarget.fullName.value === userName &&
      e.currentTarget.phone.value === phone
    ) {
      e.preventDefault();
      setIsSubmitting(false);
      return;
    }
    if (e.currentTarget.fullName.value !== userName) {
      e.preventDefault();
      handleRequest(e, updateName, router);
    }
    if (e.currentTarget.phone.value !== phone) {
      handleRequest(e, updatePhone, router);
    }
    setIsSubmitting(false);
  };

  return (
    <Card
      title="Your Account"
      description="Edit your Account info here."
      footer={
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <p className="pb-4 sm:pb-0">64 characters maximum</p>
          {user_role > 99 && (
            <Button
              variant="slim"
              type="submit"
              form="accountForm"
              loading={isSubmitting}
            >
              Update
            </Button>
          )}
        </div>
      }
    >
      <div className="mt-8 mb-4 text-xl font-semibold">
        <form
          id="accountForm"
          onSubmit={(e) => handleSubmit(e)}
          className="flex flex-col gap-5"
        >
          <input
            type="text"
            name="fullName"
            className="w-1/2 p-3 rounded-md bg-zinc-800"
            defaultValue={userName}
            placeholder="Your name"
            maxLength={64}
          />
          <input
            type="tel"
            name="phone"
            defaultValue={phone ?? ''}
            className="w-1/2 p-3 rounded-md bg-zinc-800"
            placeholder="Phone Number"
            // pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
          />
        </form>
      </div>
    </Card>
  );
}
