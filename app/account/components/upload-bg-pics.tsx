'use client';

import React, { useMemo } from 'react';
import ResponsiveFileUpload from '@/app/(biz)/biz/vehicles/[id]/components/responsive-file-upload';
import { createId } from '@paralleldrive/cuid2';

/**
 * Component: UploadBgPics
 * Description: A wrapper for the generic file uploader specific to User Backgrounds.
 * * THEME CONTEXT:
 * This component typically renders inside a DialogContent (bg-card).
 * The ResponsiveFileUpload component handles its own internal semantic styling (buttons, dropzones),
 * so we mostly focus on layout stability here.
 */
const UploadBgPics = ({ user_id }: { user_id: string }) => {
  
  // ----------------------------------------------------------------
  // STABILITY FIX
  // ----------------------------------------------------------------
  // We use useMemo here because calling createId() directly in the JSX 
  // would generate a new unique ID on every single render cycle.
  // This causes the uploader prop 'url_key' to change, which forces 
  // the ResponsiveFileUpload component to reset/remount unnecessarily.
  const uniqueUploadId = useMemo(() => createId(), []);

  return (
    // SEMANTIC: Layout Wrapper
    // Ensures the uploader consumes full available width of the parent Card/Dialog
    <div className="w-full min-h-[200px] flex flex-col justify-center">
      <ResponsiveFileUpload
        url_key={`background-images/${user_id}/${uniqueUploadId}`}
        bucket="users"
        single={true}
      />
    </div>
  );
};

export default UploadBgPics;