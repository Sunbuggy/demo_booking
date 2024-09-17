'use client';
import React from 'react';
import TagForm from './tag-form-wrapper';
import DialogFactory from '../../admin/tables/components/dialog-factory';
import { Button } from '@/components/ui/button';
import ClosedTags from './closed-tags';
import { Eye, Plus } from 'lucide-react';
import { VehicleTagType } from '../../admin/page';
import dayjs from 'dayjs';
import { User } from '@supabase/supabase-js';

const TagManagement = ({
  id,
  tags,
  user
}: {
  id: string;
  tags: VehicleTagType[];
  user: User;
}) => {
  const [isAddTagDialogOpen, setIsAddTagDialogOpen] = React.useState(false);
  const [isDisplayClosedTagsDialogOpen, setDisplayClosedTagsDialogOpen] =
    React.useState(false);
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
    <div className="flex flex-col gap-4">
      <div className="flex gap-5">
        <Button
          size={'sm'}
          variant={'ghost'}
          className="underline"
          onClick={() => setIsAddTagDialogOpen(true)}
        >
          <span className="mr-2">
            <Plus />
          </span>
          Add A New Tag
        </Button>
        <DialogFactory
          children={<TagForm user={user} tag={null} />}
          title="Add a New Tag"
          description="Add a new tag to the vehicle."
          isDialogOpen={isAddTagDialogOpen}
          setIsDialogOpen={setIsAddTagDialogOpen}
        />
        <div>
          <Button
            size={'sm'}
            variant={'ghost'}
            className="underline"
            onClick={() => setDisplayClosedTagsDialogOpen(true)}
          >
            <span className="mr-2">
              <Eye />
            </span>
            Display Closed Tags
          </Button>
          <DialogFactory
            children={<ClosedTags user={user} tags={tags} />}
            title="Closed Tags"
            description="Display existing tags for the vehicle."
            isDialogOpen={isDisplayClosedTagsDialogOpen}
            setIsDialogOpen={setDisplayClosedTagsDialogOpen}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h4> Open Tags</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tags
            .sort(
              (a, b) =>
                dayjs(b.created_at || '').unix() -
                dayjs(a.created_at || '').unix()
            )
            .map((tag) => {
              const tagTitle = `${dayjs(tag.created_at || '').format('YY/MM/DD@hh:mm a')} (${tag.created_by_legacy || tag.created_by || (tag.created_by_legacy === undefined && tag.created_by === '' && 'nouser')})`;
              // only 50 characters of notes are displayed
              const tagTitleFromNotes = `${dayjs(tag.created_at || '').format('YY/MM/DD@hh:mma')} ${tag.notes ? tag.notes.replace('|||', '').slice(0, 30).trim() : ''}`;
              if (tag.tag_status === 'open') {
                return (
                  <React.Fragment key={tag.id}>
                    <Button
                      size={'sm'}
                      variant={'ghost'}
                      className={`border  text-xs ${tag?.tag_type === 'maintenance' ? 'border-amber-500' : tag?.tag_type === 'repair' ? 'border-red-500' : 'border-green-500'} w-[350px]`}
                      onClick={() => handleOpenTagDialog(tag.id)}
                    >
                      {tagTitleFromNotes}
                    </Button>
                    <DialogFactory
                      children={<TagForm user={user} tag={tag} />}
                      title={tagTitle}
                      description={`Edit ${tag.id}`}
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
      </div>
    </div>
  );
};

export default TagManagement;
