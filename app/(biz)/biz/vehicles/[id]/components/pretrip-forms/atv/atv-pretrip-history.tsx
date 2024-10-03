import React from 'react';
import { Database } from '@/types_db';
import { fetchPretripFormHistory } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import { fields, formSchema } from './atv-pretrip-form';
import { FactoryForm } from '@/components/factory-form';
import { Button } from '@/components/ui/button';
import DialogFactory from '@/components/dialog-factory';

const AtvPretripHisotry = ({
  veh_id,
  vehicle_name
}: {
  veh_id: string;
  vehicle_name: string;
}) => {
  const [atvPretripHistory, setAtvPretripHistory] = React.useState<
    Database['public']['Tables']['vehicle_pretrip_atv']['Row'][]
  >([]);
  const [openPretripFormHistory, setOpenPretripFormHistory] = React.useState<{
    [key: string]: boolean;
  }>({});
  const supabase = createClient();
  const handleOpenPretripFormHistory = (tagId: string) => {
    setOpenPretripFormHistory((prev) => ({ ...prev, [tagId]: true }));
  };

  const handleCloseTagDialog = (tagId: string) => {
    setOpenPretripFormHistory((prev) => ({ ...prev, [tagId]: false }));
  };

  React.useEffect(() => {
    async function fetchHistory() {
      await fetchPretripFormHistory(
        supabase,
        veh_id,
        'vehicle_pretrip_atv'
      ).then((data) => {
        setAtvPretripHistory(data);
      });
    }
    fetchHistory();
  }, []);

  const onSubmit = (data: any) => {
    return null;
  };

  const pretripTitle = (
    <div className="flex gap-2">
      <h3>Pretrip Form:</h3>
      <p className="text-orange-500">{vehicle_name}</p>
    </div>
  );

  return (
    <>
      {atvPretripHistory.map((pretripHistory, index) => {
        // change all boolean values to string inside pretripHistory
        Object.keys(pretripHistory).forEach((key) => {
          const typedKey = key as keyof typeof pretripHistory;
          if (typeof pretripHistory[typedKey] === 'boolean') {
            (pretripHistory as Record<string, any>)[typedKey] =
              pretripHistory[typedKey]?.toString() || '';
          }
        });
        // change all null values to empty string if type is string
        Object.keys(pretripHistory).forEach((key) => {
          const typedKey = key as keyof typeof pretripHistory;
          if (pretripHistory[typedKey] === null) {
            (pretripHistory as Record<string, any>)[typedKey] = '';
          }
        });

        return (
          <div key={index}>
            <Button
              size={'sm'}
              variant={'ghost'}
              className="border border-gray-300"
              onClick={() => handleOpenPretripFormHistory(pretripHistory.id)}
            >
              {pretripHistory?.created_at?.split('T')[0]}
            </Button>
            <DialogFactory
              children={
                <FactoryForm
                  onSubmit={onSubmit}
                  formSchema={formSchema}
                  fields={fields}
                  hideFilterBoxField={true}
                  initialData={[pretripHistory]}
                  allDisabled={true}
                />
              }
              title={pretripTitle}
              description={`ID: ${pretripHistory.id}`}
              isDialogOpen={openPretripFormHistory[pretripHistory.id] || false}
              setIsDialogOpen={(isOpen) =>
                isOpen
                  ? handleOpenPretripFormHistory(pretripHistory.id)
                  : handleCloseTagDialog(pretripHistory.id)
              }
            />
          </div>
        );
      })}
    </>
  );
};

export default AtvPretripHisotry;
