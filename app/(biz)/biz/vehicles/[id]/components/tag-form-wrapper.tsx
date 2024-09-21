'use client';
import React from 'react';
import { VehicleTagType } from '../../admin/page';
import NewTagForm from './new-tag-form';
import ExistingTagForm from './existing-tag-form';
import { User } from '@supabase/supabase-js';

const TagForm = ({
  tag,
  user,
  status,
  id,
  vehicle_name
}: {
  tag: VehicleTagType | null;
  user: User;
  status?: string;
  id?: string;
  vehicle_name: string;
}) => {
  if (tag === null) {
    return <NewTagForm user={user} id={id || ''} />;
  } else {
    return <ExistingTagForm user={user} tag={tag} status={status} />;
  }
};

export default TagForm;
