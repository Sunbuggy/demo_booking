'use client';
import React, { useState } from 'react';
import PicForm from './pic-upload-form';
import { FaCamera } from 'react-icons/fa'; // Import the camera icon from react-icons

interface GroupPicsProps {
  groupName: string; // Add groupName as a prop
}

export default function GroupPics({ groupName }: GroupPicsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div>
      {/* Icon button to open the dialog */}
      <button
        onClick={() => setIsDialogOpen(true)}
        className="pr-2"
      >
        <FaCamera className="w-4 h-4 text-red-600 hover:text-red-800" />
      </button>

      {/* PicForm dialog */}
      <PicForm isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} groupName={groupName} />
    </div>
  );
}