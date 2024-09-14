'use client';
import React from 'react';
import TagForm from './tag-form';
import DialogFactory from '../../admin/tables/components/dialog-factory';
import { Button } from '@/components/ui/button';
import ExistingTags from './existing-tags';
import { Eye, Plus } from 'lucide-react';
import { VehicleTagType } from '../../admin/page';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

const TagManagement = ({
  id,
  tags
}: {
  id: string;
  tags: VehicleTagType[];
}) => {
  const [isAddTagDialogOpen, setIsAddTagDialogOpen] = React.useState(false);
  const [isDisplayExistingTagsDialogOpen, setDisplayExistingTagsDialogOpen] =
    React.useState(false);

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
          children={<TagForm id={id} tag={null} />}
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
            onClick={() => setDisplayExistingTagsDialogOpen(true)}
          >
            <span className="mr-2">
              <Eye />
            </span>
            Display Closed Tags
          </Button>
          <DialogFactory
            children={<ExistingTags id={id} tags={tags} />}
            title="Closed Tags"
            description="Display existing tags for the vehicle."
            isDialogOpen={isDisplayExistingTagsDialogOpen}
            setIsDialogOpen={setDisplayExistingTagsDialogOpen}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h4> Open Tags</h4>

        {/* Put every tag that has a tag_status of open inside of these popovers with the trigger being the created_at date only and the contents being a form for showing the whole data */}
        {tags.map((tag) => {
          if (tag.tag_status === 'open') {
            return (
              <Popover key={tag.id}>
                <PopoverTrigger>
                  <div className="flex justify-between">
                    <span>{tag.created_at}</span>
                    <span>{tag.created_by}</span>
                  </div>
                </PopoverTrigger>
                <PopoverContent>
                  <TagForm id={id} tag={tag} />
                </PopoverContent>
              </Popover>
            );
          }
        })}
      </div>
    </div>
  );
};

export default TagManagement;
