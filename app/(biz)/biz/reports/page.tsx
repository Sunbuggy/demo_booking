import { createClient } from '@/utils/supabase/server';
import ReportsBoard from './components/ReportsBoard';
import LocationStat from './components/LocationStats';

// ------------------------------------------------------------------
// TYPE DEFINITIONS
// ------------------------------------------------------------------
interface BaseRecord {
  id: string;
  created_at: string;
  vehicle_id?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  closed_by?: string | null;
  amount?: string | number | null;
  [key: string]: any;
}

export default async function ReportsPage() {
  const supabase = await createClient();

  // ------------------------------------------------------------------
  // DATA FETCHING STRATEGY: PARALLEL EXECUTION
  // ------------------------------------------------------------------
  const [
    tagsRes,
    locationsRes,
    atvRes,
    buggyRes,
    shuttleRes,
    truckRes,
    pismoRes,
    timeEntriesRes,
    vehiclesRes,
    usersRes,
    employeeRes,
  ] = await Promise.all([
    supabase.from('vehicle_tag').select('*').order('created_at', { ascending: false }),
    supabase.from('vehicle_locations').select('*').order('created_at', { ascending: false }),
    supabase.from('vehicle_pretrip_atv').select('*').order('created_at', { ascending: false }),
    supabase.from('vehicle_pretrip_buggy').select('*').order('created_at', { ascending: false }),
    supabase.from('vehicle_pretrip_shuttle').select('*').order('created_at', { ascending: false }),
    supabase.from('vehicle_pretrip_truck').select('*').order('created_at', { ascending: false }),
    supabase.from('charges_pismo').select('*').order('created_at', { ascending: false }),
    supabase.from('time_entries').select(`
      *,
      users(full_name),
      clock_in(clock_in_time, lat, long),
      clock_out(clock_out_time, lat, long)
    `).order('created_at', { ascending: false }),
    supabase.from('vehicles').select('id, name'),
    supabase.from('users').select('id, full_name'),
    supabase.from('employee_details').select('user_id, emp_id'),
  ]);

  // ------------------------------------------------------------------
  // DATA PREPARATION & DEFAULTS
  // ------------------------------------------------------------------
  const tags = tagsRes.data || [];
  const allLocations = locationsRes.data || [];
  const atvPretrips = atvRes.data || [];
  const buggyPretrips = buggyRes.data || [];
  const shuttlePretrips = shuttleRes.data || [];
  const truckPretrips = truckRes.data || [];
  const chargesPismo = pismoRes.data || [];
  const timeEntries = timeEntriesRes.data || [];
  
  const vehicles = vehiclesRes.data || [];
  const users = usersRes.data || [];
  const employees = employeeRes.data || [];

  // Derived Datasets
  const ssts = allLocations.filter((scan) => scan.is_distress_signal === true);

  // ------------------------------------------------------------------
  // MAPPING & FORMATTING
  // ------------------------------------------------------------------
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const mapData = (data: BaseRecord[]) => {
    return data.map((item) => {
      const getEmpId = (userId: string | null | undefined) => 
        userId ? employees.find((e) => e.user_id === userId)?.emp_id || '' : '';

      const getUserName = (userId: string | null | undefined) =>
        userId ? users.find((u) => u.id === userId)?.full_name || userId : '';

      return {
        ...item,
        vehicle_id: vehicles.find((v) => v.id === item.vehicle_id)?.name || item.vehicle_id,
        created_by: getUserName(item.created_by),
        updated_by: getUserName(item.updated_by),
        closed_by: getUserName(item.closed_by),
        created_by_id: getEmpId(item.created_by),
        updated_by_id: getEmpId(item.updated_by),
        closed_by_id: getEmpId(item.closed_by),
        amount: item.amount ? currencyFormatter.format(Number(item.amount)) : '$0.00',
      };
    });
  };

  const mappedTimeEntries = timeEntries.map((entry: any) => ({
    user: entry.users?.full_name || 'Unknown',
    clock_in_time: entry.clock_in?.clock_in_time || 'N/A',
    clock_in_location: `(${entry.clock_in?.lat || 'N/A'}, ${entry.clock_in?.long || 'N/A'})`,
    clock_out_time: entry.clock_out?.clock_out_time || 'N/A',
    clock_out_location: `(${entry.clock_out?.lat || 'N/A'}, ${entry.clock_out?.long || 'N/A'})`,
    duration: entry.duration || 0,
    date: entry.date || 'Unknown',
  }));

  const tables = [
    { name: 'Tags', data: mapData(tags) },
    { name: 'Scans', data: mapData(allLocations) },
    { name: 'SSTs', data: mapData(ssts) },
    { name: 'ATV Pre-trips', data: mapData(atvPretrips) },
    { name: 'Buggy Pre-trips', data: mapData(buggyPretrips) },
    { name: 'Shuttle Pre-trips', data: mapData(shuttlePretrips) },
    { name: 'Truck Pre-trips', data: mapData(truckPretrips) },
    { name: 'Pismo Charges', data: mapData(chargesPismo) },
    { name: 'Vehicle Locations', data: mapData(allLocations) }, 
    { name: 'Time Entries', data: mappedTimeEntries },
  ];

  return (
    // THEME FIX: 
    // Replaced 'bg-zinc-950 text-zinc-100' with 'bg-background text-foreground'
    // This allows the global theme (Light/Dark) to control colors automatically.
    <div className="py-8 px-4 md:px-6 min-h-screen bg-background text-foreground overflow-x-hidden w-full">
      
      {/* HEADER SECTION */}
      {/* Replaced 'border-zinc-800' with 'border-border' */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-border pb-8">
        
        {/* Left Side: Title */}
        <div>
          {/* Replaced 'text-white' with 'text-foreground' (or 'text-primary' if you want brand color) */}
          <h1 className="text-3xl md:text-4xl font-black italic uppercase text-foreground tracking-tighter">
            Current Charges
          </h1>
          {/* Replaced 'text-zinc-500' with 'text-muted-foreground' */}
          <p className="text-muted-foreground text-sm mt-1">
            Real-time Fleet & POS Data
          </p>
        </div>

        {/* Right Side: Real-time Location Stats */}
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
             <LocationStat location="vegas" label="Las Vegas" />
             <LocationStat location="pismo" label="Pismo Beach" />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <section className="w-full">
        <ReportsBoard tables={tables} />
      </section>
    </div>
  );
}