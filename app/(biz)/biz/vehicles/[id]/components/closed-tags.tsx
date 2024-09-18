'use client'
import React from 'react';
import { VehicleTagType } from '../../admin/page';
import TagForm from './tag-form-wrapper';
import dayjs from 'dayjs';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import DialogFactory from '../../admin/tables/components/dialog-factory';
import { getUserDetailsById } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

const ClosedTags = ({ tags, user }: { tags: VehicleTagType[]; user: User }) => {
  const supabase = createClient();
  const router = useRouter()
  // display all the existing tags for the vehicle where the tag_status is closed
  const [openTagDialogs, setOpenTagDialogs] = React.useState<{
    [key: string]: boolean;
  }>({});
  const [createdByMap, setCreatedByMap] = React.useState<{ [key: string]: string | null }>({});
  const handleOpenTagDialog = (tagId: string) => {
    setOpenTagDialogs((prev) => ({ ...prev, [tagId]: true }));
  };

  const handleCloseTagDialog = (tagId: string) => {
    setOpenTagDialogs((prev) => ({ ...prev, [tagId]: false }));
  };

    React.useEffect(() => {
    const fetchCreatedBy = async () => {
      const newCreatedByMap: { [key: string]: string | null } = {};
      for (const tag of tags) {
        if (tag.created_by) {
          const userDetails = await getUserDetailsById( supabase, tag.created_by);
          if(userDetails)
          newCreatedByMap[tag.id] = userDetails[0].full_name || null;
        }
      }
      setCreatedByMap(newCreatedByMap);
    };

    fetchCreatedBy();
  }, [tags, supabase]);

  React.useEffect(() => {
    const channel = supabase
      .channel('realtime vehicle tags plus vehicle changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_tag'
        },
        () => {
          router.refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle'
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
      {/* sort tags by created_at date then map */}
      {tags
        .sort(
          (a, b) =>
            dayjs(b.created_at || '').unix() - dayjs(a.created_at || '').unix()
        )
        .map((tag) => {
          const tagTitle = `${dayjs(tag.created_at || '').format('YY/MM/DD@hh:mm a')} (${tag.created_by_legacy || createdByMap[tag.id] || (tag.created_by_legacy === undefined && createdByMap[tag.id] === '' && 'nouser')})`;
          // only 50 characters of notes are displayed
          const tagTitleFromNotes = `${dayjs(tag.created_at || '').format('YY/MM/DD@hh:mm a')} ${tag.notes ? tag.notes.replace('|||', '').slice(0, 30).trim() : ''}`;
          if (tag.tag_status === 'closed') {
            return (
              <React.Fragment key={tag.id}>
                <Button
                  size={'sm'}
                  variant={'ghost'}
                  className={`border  text-xs ${tag?.tag_type === 'maintenance' ? 'border-amber-500' : tag?.tag_type === 'repair' ? 'border-red-500' : 'border-green-500'}`}
                  onClick={() => handleOpenTagDialog(tag.id)}
                >
                  {tagTitleFromNotes}
                </Button>
                <DialogFactory
                  children={<TagForm user={user} tag={tag} status="closed" />}
                  title={tagTitle}
                  description={`ID: ${tag.id}`}
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
