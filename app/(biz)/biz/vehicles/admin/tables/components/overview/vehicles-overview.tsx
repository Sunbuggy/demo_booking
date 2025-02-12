'use client';

import { createClient } from '@/utils/supabase/client';
import {
  fetchAllVehicleLocations,
  fetchVehicles
} from '@/utils/supabase/queries';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import DialogFactory from '@/components/dialog-factory';
import VehiclesLister from '../vehicles-lister';
import { LocationSelector } from './components/LocationSelector';
import { VehicleOverviewTable } from './components/VehicleOverviewTable';
import { VehicleBySeatCountTable } from './components/VehicleBySeatCountTable';
import {
  calculateAverageVehicleAge,
  getLocationType,
  groupVehicles,
  groupVehiclesBySeatCount,
  processVehicleLocations
} from './utils/vehicleUtils';
import { ErrorMessage } from './components/ErrorMessage';
import { VehicleType } from '../../../page';
import { VehicleLocation } from '../../../../types';
import { LoadingSpinner } from './components/LoadingSpinner';
import MapComponent from '../mapcomponent';
import { VehicleStatusPieChart } from './components/VehicleStatusPieChart';
import { VehicleTypeBarChart } from './components/VehicleTypeBarChart';

export default function VehiclesOverview() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedOverViewList, setSelectedOverViewList] = useState<string[]>(
    []
  );
  const [openOverviewDialog, setOpenOverviewDialog] = useState<
    'total' | 'operational' | 'broken' | null
  >(null);

  const supabase = createClient();

  const {
    data: vehicles,
    error: vehiclesError,
    isLoading: isVehiclesLoading
  } = useQuery<VehicleType[], Error>({
    queryKey: ['vehicles'],
    queryFn: () => fetchVehicles(supabase)
  });

  const {
    data: vehicleLocations,
    error: locationsError,
    isLoading: isLocationsLoading
  } = useQuery<VehicleLocation[], Error>({
    queryKey: ['vehicleLocations'],
    queryFn: () => fetchAllVehicleLocations(supabase)
  });

  const latestVehicleLocations = useMemo(() => {
    if (!vehicleLocations) return {};
    return vehicleLocations.reduce(
      (acc, location) => {
        if (
          location.vehicle_id &&
          (!acc[location.vehicle_id] ||
            acc[location.vehicle_id].created_at < location.created_at)
        ) {
          acc[location.vehicle_id] = location;
        }
        return acc;
      },
      {} as Record<string, VehicleLocation>
    );
  }, [vehicleLocations]);

  const vehiclesWithLocation = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.map((vehicle) => {
      const location = latestVehicleLocations[vehicle.id];
      return {
        ...vehicle,
        city:
          location && location.latitude && location.longitude
            ? getLocationType(
                location.latitude,
                location.longitude,
                location.city || ''
              )
            : 'No Location',
        latitude: location?.latitude,
        longitude: location?.longitude,
        location_created_at: location?.created_at
      };
    });
  }, [vehicles, latestVehicleLocations]);

  const filteredVehicles = useMemo(() => {
    return selectedLocation === 'all'
      ? vehiclesWithLocation
      : vehiclesWithLocation.filter((v) =>
          v.city.toLowerCase().includes(selectedLocation.toLowerCase())
        );
  }, [vehiclesWithLocation, selectedLocation]);

  const vehicleTypes = useMemo(
    () => groupVehicles(filteredVehicles),
    [filteredVehicles]
  );

  const averageVehicleAge = useMemo(
    () => calculateAverageVehicleAge(filteredVehicles),
    [filteredVehicles]
  );

  const buggiesBySeatCount = useMemo(
    () => groupVehiclesBySeatCount(filteredVehicles, 'buggy'),
    [filteredVehicles]
  );

  const atvsBySeatCount = useMemo(
    () => groupVehiclesBySeatCount(filteredVehicles, 'atv'),
    [filteredVehicles]
  );

  const handleOverviewDialogOpen = useCallback(
    (list: string[], type: 'total' | 'operational' | 'broken') => {
      setSelectedOverViewList(list);
      setOpenOverviewDialog(type);
    },
    []
  );

  const isLoading = isVehiclesLoading || isLocationsLoading;
  const error = vehiclesError || locationsError;

  if (isLoading || !vehicles || !vehicleLocations) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center z-50 gap-4">
        <h1 className="text-2xl font-bold">Vehicles Overview</h1>
        <LocationSelector
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
        />
      </div>

      <VehicleOverviewTable
        vehicles={filteredVehicles}
        vehicleTypes={vehicleTypes}
        handleOverviewDialogOpen={handleOverviewDialogOpen}
      />

      {openOverviewDialog && (
        <DialogFactory
          title={`${openOverviewDialog.charAt(0).toUpperCase() + openOverviewDialog.slice(1)} Vehicles Overview`}
          setIsDialogOpen={() => setOpenOverviewDialog(null)}
          isDialogOpen={!!openOverviewDialog}
          description={`Overview of ${openOverviewDialog} vehicles.`}
          children={<VehiclesLister list={selectedOverViewList} />}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VehicleBySeatCountTable
          title="Buggies by Seat Count"
          vehiclesBySeatCount={buggiesBySeatCount}
          handleOverviewDialogOpen={handleOverviewDialogOpen}
        />
        <VehicleBySeatCountTable
          title="ATVs by Seat Count"
          vehiclesBySeatCount={atvsBySeatCount}
          handleOverviewDialogOpen={handleOverviewDialogOpen}
        />
      </div>
      <div className="z-30">
        <MapComponent vehicles={filteredVehicles} />
      </div>
      <div className="w-full md:w-1/2 mx-auto mb-6">
        <VehicleStatusPieChart
          operational={
            filteredVehicles.filter((v) => v.vehicle_status !== 'broken').length
          }
          broken={
            filteredVehicles.filter((v) => v.vehicle_status === 'broken').length
          }
        />
      </div>
      <div className="w-full mb-6">
        <VehicleTypeBarChart vehicleTypes={vehicleTypes} />
      </div>
      <div className="text-lg font-semibold mb-4">
        Average Vehicle Age: {averageVehicleAge.toFixed(1)} years
      </div>
    </div>
  );
}
