
import { 
  mbj_vehicles_list, 
  atv_vehicles_list, 
  vof_vehicles_list, 
  ffr_vehicles_list 
} from '@/utils/helpers';

export type VehicleLocation = 'Nellis30' | 'Nellis60' | 'mb120' | 'DunesATV' | 'ValleyOfFire' | 'FamilyFun';

export const getVehicleList = (location: VehicleLocation) => {
  switch (location) {
    case 'Nellis30':
    case 'Nellis60':
    case 'mb120':
      return mbj_vehicles_list;
    case 'DunesATV':
      return atv_vehicles_list;
    case 'ValleyOfFire':
      return vof_vehicles_list;
    case 'FamilyFun':
      return ffr_vehicles_list;
    default:
      return mbj_vehicles_list;
  }
};

// Helper to get the location from tab value
// export const getLocationFromTab = (selectedTabValue: string): VehicleLocation => {
//   return selectedTabValue === 'mb30' ? 'mb30' :
//          selectedTabValue === 'mb60' ? 'mb60' :
//          selectedTabValue === 'mb120' ? 'mb120' :
//          'mb30'; // Default fallback
// };