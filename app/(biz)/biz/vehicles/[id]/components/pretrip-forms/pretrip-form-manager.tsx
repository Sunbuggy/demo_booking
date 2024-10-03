import DialogFactory from '@/components/dialog-factory';
import { Button } from '@/components/ui/button';
import React from 'react';
import ShuttlePretripHistory from './shuttle/shuttle-pretrip-history';
import ForkliftPretripHistory from './forklift/forklift-pretrip-history';
import BuggyPretripHistory from './buggy/buggy-pretrip-history';
import AtvPretripHisotry from './atv/atv-pretrip-history';
import ShuttlePretripForm from './shuttle/shuttle-pretrip-form';
import TruckPretripForm from './truck/truck-pretrip-form';
import ATVPretripForm from './atv/atv-pretrip-form';
import BuggyPretripForm from './buggy/buggy-pretrip-form';
import ForkliftPretripForm from './forklift/forklift-pretrip-form';
import TruckPretripHistory from './truck/truck-pretrip-history';
import { VehicleType } from '../../../admin/page';
import { User } from '@supabase/supabase-js';

const PretripFormManager = ({
  setIsPretripFormOpen,
  isPretripFormOpen,
  vehicleInfo,
  user
}: {
  setIsPretripFormOpen: (value: React.SetStateAction<boolean>) => void;
  isPretripFormOpen: boolean;
  vehicleInfo: VehicleType;
  user: User;
}) => {
  return (
    <>
      <Button className="mb-5" onClick={() => setIsPretripFormOpen(true)}>
        View Pretrip Form History
      </Button>
      <DialogFactory
        title={'Pretrip Form History'}
        setIsDialogOpen={setIsPretripFormOpen}
        isDialogOpen={isPretripFormOpen}
        description="History of pretrip forms for the vehicle."
        children={
          <>
            {vehicleInfo.type === 'shuttle' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                <ShuttlePretripHistory
                  veh_id={vehicleInfo.id}
                  vehicle_name={vehicleInfo.name}
                />
              </div>
            )}
            {vehicleInfo.type === 'truck' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                <TruckPretripHistory
                  veh_id={vehicleInfo.id}
                  vehicle_name={vehicleInfo.name}
                />
              </div>
            )}
            {vehicleInfo.type === 'atv' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                <AtvPretripHisotry
                  veh_id={vehicleInfo.id}
                  vehicle_name={vehicleInfo.name}
                />
              </div>
            )}

            {vehicleInfo.type === 'buggy' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                <BuggyPretripHistory
                  veh_id={vehicleInfo.id}
                  vehicle_name={vehicleInfo.name}
                />
              </div>
            )}

            {vehicleInfo.type === 'forktruck' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                <ForkliftPretripHistory
                  veh_id={vehicleInfo.id}
                  vehicle_name={vehicleInfo.name}
                />
              </div>
            )}
          </>
        }
      />
      {vehicleInfo.type === 'shuttle' && (
        <div>
          <ShuttlePretripForm user_id={user.id} vehicle_id={vehicleInfo.id} />
        </div>
      )}
      {vehicleInfo.type === 'truck' && (
        <div>
          <TruckPretripForm user_id={user.id} vehicle_id={vehicleInfo.id} />
        </div>
      )}
      {vehicleInfo.type === 'atv' && (
        <div>
          <ATVPretripForm user_id={user.id} vehicle_id={vehicleInfo.id} />
        </div>
      )}
      {vehicleInfo.type === 'buggy' && (
        <div>
          <BuggyPretripForm user_id={user.id} vehicle_id={vehicleInfo.id} />
        </div>
      )}
      {vehicleInfo.type === 'forktruck' && (
        <div>
          <ForkliftPretripForm user_id={user.id} vehicle_id={vehicleInfo.id} />
        </div>
      )}
    </>
  );
};

export default PretripFormManager;
