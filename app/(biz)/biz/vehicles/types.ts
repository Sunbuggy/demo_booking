import { Database } from '@/types_db';

export type VehicleLocation =
  Database['public']['Tables']['vehicle_locations']['Row'];
export type InventoryLocation =
  Database['public']['Tables']['vehicle_inventory_location']['Row'];
export type InventoryLocationInsert =
  Database['public']['Tables']['vehicle_inventory_location']['Insert'];
export type VehiclesType = Database['public']['Tables']['vehicles']['Row'];

export type VehicleFutureLocationType =
  Database['public']['Tables']['vehicle_future_location']['Row'];
