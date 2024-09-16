import React from 'react';
import { VehicleTagType } from '../../admin/page';
import TagForm from './tag-form-wrapper';
import dayjs from 'dayjs';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import DialogFactory from '../../admin/tables/components/dialog-factory';

const ClosedTags = ({ tags, user }: { tags: VehicleTagType[]; user: User }) => {
  // display all the existing tags for the vehicle where the tag_status is closed
  const [openTagDialogs, setOpenTagDialogs] = React.useState<{
    [key: string]: boolean;
  }>({});
  const handleOpenTagDialog = (tagId: string) => {
    setOpenTagDialogs((prev) => ({ ...prev, [tagId]: true }));
  };

  const handleCloseTagDialog = (tagId: string) => {
    setOpenTagDialogs((prev) => ({ ...prev, [tagId]: false }));
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
      {tags.map((tag) => {
        const tagTitle = `${dayjs(tag.created_at || '').format('YY/MM/DD@hh:mm a')} (${tag.created_by_legacy || tag.created_by || (tag.created_by_legacy === undefined && tag.created_by === '' && 'nouser')})`;
        if (tag.tag_status === 'open') {
          return (
            <React.Fragment key={tag.id}>
              <Button
                size={'sm'}
                variant={'ghost'}
                className="border border-red-500 text-xs"
                onClick={() => handleOpenTagDialog(tag.id)}
              >
                {tagTitle}
              </Button>
              <DialogFactory
                children={<TagForm user={user} tag={tag} status="closed" />}
                title={tagTitle}
                description={`${tag.id}`}
                isDialogOpen={openTagDialogs[tag.id] || false}
                setIsDialogOpen={(isOpen) =>
                  isOpen
                    ? handleOpenTagDialog(tag.id)
                    : handleCloseTagDialog(tag.id)
                }
              />
            </React.Fragment>
          );
        }
      })}
    </div>
  );
};

export default ClosedTags;
