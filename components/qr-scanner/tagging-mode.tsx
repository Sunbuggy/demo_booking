'use client';
import TagForm from '@/app/(biz)/biz/vehicles/[id]/components/tag-form-wrapper';
import { User } from '@supabase/supabase-js';
import React from 'react';

const TaggingMode = ({ user, id }: { user: User; id: string }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold">Tagging Mode</h1>
      <p className="text-sm m-2 text-slate-400">
        Tagging mode allows you to tag vehicles for inventory.
      </p>
      <TagForm user={user} tag={null} id={id} />
    </div>
  );
};

export default TaggingMode;
