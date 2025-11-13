import ResponsiveFileUpload from '@/app/(biz)/biz/vehicles/[id]/components/responsive-file-upload';
import React from 'react';
import { createId } from '@paralleldrive/cuid2';

const UploadBgPics = ({ user_id }: { user_id: string }) => {
  return (
    <ResponsiveFileUpload
      url_key={`background-images/${user_id}/${createId()}`}
      bucket="users"
      single={true}
    />
  );
};

export default UploadBgPics;
