'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, ArrowUp, ArrowDown, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function HRSettingsPage() {
  const supabase = createClient();
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA ---
  const fetchData = async () => {
    // setLoading(true); // Don't block UI on re-fetch for smoother sorting
    const [locs, depts, pos] = await Promise.all([
      supabase.from('locations').select('*').order('sort_order', { ascending: true }),
      supabase.from('departments').select('*').order('sort_order', { ascending: true }),
      supabase.from('positions').select('*').order('sort_order', { ascending: true }),
    ]);
    if (locs.data) setLocations(locs.data);
    if (depts.data) setDepartments(depts.data);
    if (pos.data) setPositions(pos.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- REORDER LOGIC (SELF-HEALING) ---
  const handleReorder = async (
    table: 'locations' | 'departments' | 'positions', 
    items: any[], 
    currentIndex: number, 
    direction: 'up' | 'down'
  ) => {
    // 1. Calculate new index
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return; // Out of bounds

    // 2. Swap in memory
    const newItems = [...items];
    const [movedItem] = newItems.splice(currentIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);

    // 3. Optimistic UI Update (Instant feel)
    if (table === 'locations') setLocations(newItems);
    if (table === 'departments') {
       // Only update the subset in state to avoid weird jumps, or just refetch. 
       // For simplicity in this deep nesting, we'll wait for DB but show a toast.
    }

    // 4. Batch Update "Self-Healing" (Renumber 10, 20, 30...)
    // We update the entire group to ensure sort_order is clean and sequential
    const updates = newItems.map((item, index) => ({
        id: item.id,
        sort_order: (index + 1) * 10 // Leaves gaps for future inserts
    }));

    // 5. Send to DB
    // Supabase upsert requires all primary keys.
    // We do a loop for simplicity (it's rarely more than 10 items)
    let errorOccurred = false;
    for (const update of updates) {
        const { error } = await supabase.from(table).update({ sort_order: update.sort_order }).eq('id', update.id);
        if (error) errorOccurred = true;
    }

    if (errorOccurred) {
        toast.error("Error reordering items");
    } else {
        toast.success("Order Updated");
        fetchData(); // Refresh to sync perfect state
    }
  };

  // --- CRUD HANDLERS ---
  const handleAddLocation = async () => {
    const name = prompt("Enter Location Name (e.g. 'Silver Lake'):");
    if (!name) return;
    const { error } = await supabase.from('locations').insert({ name, sort_order: (locations.length + 1) * 10 });
    if (error) toast.error(error.message); else { toast.success("Location Added"); fetchData(); }
  };

  const handleAddDept = async (locId: string) => {
    const name = prompt("Enter Department Name (e.g. 'OFFICE'):");
    if (!name) return;
    const currentCount = departments.filter(d => d.location_id === locId).length;
    const { error } = await supabase.from('departments').insert({ location_id: locId, name, sort_order: (currentCount + 1) * 10 });
    if (error) toast.error(error.message); else { toast.success("Department Added"); fetchData(); }
  };

  const handleAddPos = async (deptId: string) => {
    const title = prompt("Enter Position Title (e.g. 'ATV TECH'):");
    if (!title) return;
    const keyword = title.split(' ')[0].toUpperCase(); 
    const currentCount = positions.filter(p => p.department_id === deptId).length;
    const { error } = await supabase.from('positions').insert({ department_id: deptId, title, keyword, sort_order: (currentCount + 1) * 10 });
    if (error) toast.error(error.message); else { toast.success("Position Added"); fetchData(); }
  };

  const handleDelete = async (table: string, id: string) => {
    if (!confirm("Are you sure? This deletes all items inside it too!")) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); fetchData(); }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading HR Configuration...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">HR Configuration</h1>
            <p className="text-muted-foreground">Manage Locations, Departments, and Job Titles globally.</p>
        </div>
        <Button onClick={handleAddLocation} className="bg-primary text-primary-foreground font-bold shadow-lg hover:scale-105 transition-transform">
            <Plus className="mr-2 h-5 w-5"/> Add Location
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {locations.map((loc, locIndex) => (
          <div key={loc.id} className="border rounded-2xl bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            {/* Location Header */}
            <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 border-b flex justify-between items-center group">
              <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleReorder('locations', locations, locIndex, 'up')} className="hover:text-blue-500 disabled:opacity-30" disabled={locIndex === 0}><ArrowUp size={16}/></button>
                      <button onClick={() => handleReorder('locations', locations, locIndex, 'down')} className="hover:text-blue-500 disabled:opacity-30" disabled={locIndex === locations.length - 1}><ArrowDown size={16}/></button>
                  </div>
                  <Badge variant="outline" className="bg-background text-muted-foreground">LOC</Badge>
                  <h2 className="text-2xl font-bold text-foreground">{loc.name}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete('locations', loc.id)} className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"><Trash2 className="h-5 w-5"/></Button>
            </div>

            {/* Departments Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {departments
                .filter(d => d.location_id === loc.id)
                .map((dept, deptIndex, deptArray) => (
                <Card key={dept.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow relative">
                  <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col -ml-1">
                            <button onClick={() => handleReorder('departments', deptArray, deptIndex, 'up')} className="text-muted-foreground hover:text-blue-500 disabled:opacity-20" disabled={deptIndex === 0}><ArrowUp size={12}/></button>
                            <button onClick={() => handleReorder('departments', deptArray, deptIndex, 'down')} className="text-muted-foreground hover:text-blue-500 disabled:opacity-20" disabled={deptIndex === deptArray.length - 1}><ArrowDown size={12}/></button>
                        </div>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{dept.name}</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2" onClick={() => handleDelete('departments', dept.id)}><Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500"/></Button>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="space-y-1 mb-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {positions
                        .filter(p => p.department_id === dept.id)
                        .map((pos, posIndex, posArray) => (
                        <div key={pos.id} className="group flex justify-between items-center text-sm py-1 border-b last:border-0 border-dashed border-muted-foreground/20 hover:bg-muted/50 px-1 rounded">
                          <div className="flex items-center gap-2">
                              <div className="flex flex-col opacity-20 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleReorder('positions', posArray, posIndex, 'up')} className="hover:text-blue-500 disabled:opacity-0" disabled={posIndex === 0}><ArrowUp size={10}/></button>
                                <button onClick={() => handleReorder('positions', posArray, posIndex, 'down')} className="hover:text-blue-500 disabled:opacity-0" disabled={posIndex === posArray.length - 1}><ArrowDown size={10}/></button>
                              </div>
                              <span className="font-medium">{pos.title}</span>
                          </div>
                          <Trash2 className="h-3 w-3 text-red-400 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" onClick={() => handleDelete('positions', pos.id)} />
                        </div>
                      ))}
                      {positions.filter(p => p.department_id === dept.id).length === 0 && (
                          <div className="text-xs text-muted-foreground italic py-2">No positions yet.</div>
                      )}
                    </div>
                    <Button variant="secondary" size="sm" className="w-full text-xs font-bold" onClick={() => handleAddPos(dept.id)}>
                        <Plus className="h-3 w-3 mr-1"/> Add Position
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add Department Button */}
              <button 
                onClick={() => handleAddDept(loc.id)}
                className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[150px]"
              >
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="h-6 w-6" />
                </div>
                <span className="font-bold text-sm">Add Department</span>
              </button>
            </div>
          </div>
        ))}
        
        {locations.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
                No locations found. Click "Add Location" to start.
            </div>
        )}
      </div>
    </div>
  );
}