import { createClient } from '@/utils/supabase/server';
import ReportsBoard from './components/ReportsBoard';

const ReportsPage = async () => {
  const supabase = createClient();

  // Fetch data from the necessary tables and sort by created_at in descending order
  const { data: tags } = await supabase
    .from('vehicle_tag')
    .select('*')
    .order('created_at', { ascending: false });
  const { data: scans } = await supabase
    .from('vehicle_locations')
    .select('*')
    .order('created_at', { ascending: false });
  const ssts = scans?.filter((scan) => scan.is_distress_signal === true);
  const { data: atv_pretrips } = await supabase
    .from('vehicle_pretrip_atv')
    .select('*')
    .order('created_at', { ascending: false });
  const { data: buggy_pretrips } = await supabase
    .from('vehicle_pretrip_buggy')
    .select('*')
    .order('created_at', { ascending: false });
  const { data: pretrip_shuttles } = await supabase
    .from('vehicle_pretrip_shuttle')
    .select('*')
    .order('created_at', { ascending: false });
  const { data: pretrip_trucks } = await supabase
    .from('vehicle_pretrip_truck')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: timeEntries, error } = await supabase
    .from('time_entries')
    .select(
      `
      *,
      users(full_name),
      clock_in(clock_in_time, lat, long),
      clock_out(clock_out_time, lat, long)
    `
    )
    .order('created_at', { ascending: false });

  // if (error) {
  //   console.error('Error fetching time entries:', error.message);
  // }
  // console.log('Fetched time entries:', timeEntries);

  // Fetch vehicles, users, and employee details data
  const { data: vehicles } = await supabase.from('vehicles').select('*');
  const { data: users } = await supabase.from('users').select('*');
  const { data: employeeDetails } = await supabase
    .from('employee_details')
    .select('*');

  // Helper function to map vehicle_id, created_by, updated_by, and closed_by
  const mapData = (data: any[]) => {
    return data.map((item) => ({
      ...item,
      vehicle_id:
        vehicles?.find((v) => v.id === item.vehicle_id)?.name ||
        item.vehicle_id,
      created_by:
        users?.find((u) => u.id === item.created_by)?.full_name ||
        item.created_by,
      updated_by:
        users?.find((u) => u.id === item.updated_by)?.full_name ||
        item.updated_by,
      closed_by:
        users?.find((u) => u.id === item.closed_by)?.full_name ||
        item.closed_by,
      created_by_id:
        employeeDetails?.find((e) => e.user_id === item.created_by)?.emp_id ||
        '',
      updated_by_id:
        employeeDetails?.find((e) => e.user_id === item.updated_by)?.emp_id ||
        '',
      closed_by_id:
        employeeDetails?.find((e) => e.user_id === item.closed_by)?.emp_id || ''
    }));
  };

  // Map the data
  const mappedTags = mapData(tags || []);
  const mappedScans = mapData(scans || []);
  const mappedSsts = mapData(ssts || []);
  const mappedAtvPretrips = mapData(atv_pretrips || []);
  const mappedBuggyPretrips = mapData(buggy_pretrips || []);
  const mappedPretripShuttles = mapData(pretrip_shuttles || []);
  const mappedPretripTrucks = mapData(pretrip_trucks || []);

  // Map time entries
  const mappedTimeEntries = (timeEntries || []).map((entry) => ({
    user: entry.users?.full_name || 'Unknown',
    clock_in_time: entry.clock_in?.clock_in_time || 'N/A',
    clock_in_location: `(${entry.clock_in?.lat || 'N/A'}, ${
      entry.clock_in?.long || 'N/A'
    })`,
    clock_out_time: entry.clock_out?.clock_out_time || 'N/A',
    clock_out_location: `(${entry.clock_out?.lat || 'N/A'}, ${
      entry.clock_out?.long || 'N/A'
    })`,
    duration: entry.duration || 0,
    date: entry.date || 'Unknown'
  }));

  // console.log('Mapped time entries:', mappedTimeEntries);

  const tables = [
    { name: 'Tags', data: mappedTags },
    { name: 'Scans', data: mappedScans },
    { name: 'SSTs', data: mappedSsts },
    { name: 'ATV Pre-trips', data: mappedAtvPretrips },
    { name: 'Buggy Pre-trips', data: mappedBuggyPretrips },
    { name: 'Shuttle Pre-trips', data: mappedPretripShuttles },
    { name: 'Truck Pre-trips', data: mappedPretripTrucks },
    { name: 'Time Entries', data: mappedTimeEntries }
  ];

  return (
    <div className=" py-8">
      <h1 className="text-3xl font-bold mb-8">Reports</h1>
      <ReportsBoard tables={tables} />
    </div>
  );
};

export default ReportsPage;
