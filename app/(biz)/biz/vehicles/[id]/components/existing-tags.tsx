import React from 'react';
import { VehicleTagType } from '../../admin/page';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import TagForm from './tag-form';

const ExistingTags = ({ tags, id }: { tags: VehicleTagType[]; id: string }) => {
  // display all the existing tags for the vehicle where the tag_status is closed
  return (
    <div>
      {tags.map((tag) => {
        if (tag.tag_status === 'closed') {
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
  );
};

export default ExistingTags;
