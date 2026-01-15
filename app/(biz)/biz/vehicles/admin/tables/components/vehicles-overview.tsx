/**
 * @file vehicles-overview.tsx
 * @description The "Status Report" Dashboard.
 * FEATURES: Command Bar Filter, Summary Stats Table, and Live Map.
 */
'use client';

import { useState, useMemo } from 'react';
import { DashboardVehicle } from '@/app/actions/fleet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Filter, Globe } from 'lucide-react';
import MapComponent from '../mapcomponent'; 
import DialogFactory from '@/components/dialog-factory';
import VehiclesLister from '../vehicles-lister';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------
type OverviewDialogState = {
  isOpen: boolean;
  title: string;
  vehicles: DashboardVehicle[];
};

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------
export default function VehiclesOverview({ vehicles }: { vehicles: DashboardVehicle[] }) {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  
  // Dialog State
  const [dialogState, setDialogState] = useState<OverviewDialogState>({
    isOpen: false,
    title: '',
    vehicles: []
  });

  // 1. FILTER LOGIC
  const filteredVehicles = useMemo(() => {
    if (selectedLocation === 'all') return vehicles;
    const term = selectedLocation.toLowerCase();
    
    if (term === 'transit') {
      return vehicles.filter(v => 
        v.location_name === 'In Transit' || v.location_name === 'No Signal' || v.location_name === 'Unknown'
      );
    }

    return vehicles.filter(v => 
      (v.location_name || '').toLowerCase().includes(term)
    );
  }, [vehicles, selectedLocation]);

  // 2. STATS AGGREGATION
  const vehicleStats = useMemo(() => {
    const stats: Record<string, { total: number; operational: number; broken: number; list: DashboardVehicle[] }> = {};
    
    filteredVehicles.forEach(v => {
      const type = v.type || 'Other';
      if (!stats[type]) stats[type] = { total: 0, operational: 0, broken: 0, list: [] };
      
      stats[type].total++;
      stats[type].list.push(v);
      
      if (v.vehicle_status === 'broken') {
        stats[type].broken++;
      } else {
        stats[type].operational++; 
      }
    });
    
    return stats;
  }, [filteredVehicles]);

  // Helper to open drill-down
  const openList = (title: string, list: DashboardVehicle[]) => {
    setDialogState({ isOpen: true, title, vehicles: list });
  };

  // Helper for Display Name
  const getLocationLabel = (val: string) => {
    switch(val) {
      case 'all': return 'Global Fleet';
      case 'vegas': return 'Las Vegas Operations';
      case 'pismo': return 'Pismo Beach Operations';
      case 'silver lake': return 'Michigan Operations';
      case 'transit': return 'In Transit / Unknown';
      default: return val.replace(/\b\w/g, l => l.toUpperCase()); 
    }
  };

  return (
    <div className="space-y-6">
      
      {/* --- COMMAND BAR HEADER --- */}
      <div className="bg-zinc-900 text-white p-4 rounded-lg shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 border border-zinc-800">
        
        {/* Left: Active Context */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-3 bg-yellow-500/20 rounded-full text-yellow-500">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Status Report</h2>
            <div className="text-xl font-black text-white flex items-center gap-2">
              {getLocationLabel(selectedLocation)}
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border-zinc-700">
                {filteredVehicles.length} Units
              </Badge>
            </div>
          </div>
        </div>

        {/* Right: The Big Filter */}
        <div className="w-full md:w-[300px]">
          <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block pl-1">
            Switch Location Scope
          </label>
          <Select onValueChange={setSelectedLocation} defaultValue="all">
            <SelectTrigger className="h-12 bg-zinc-800 border-zinc-700 text-white font-bold text-lg focus:ring-yellow-500 focus:ring-offset-zinc-900">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-yellow-500" />
                <SelectValue placeholder="Select Location..." />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 max-h-[400px]">
              <SelectItem value="all" className="font-bold text-white py-3 border-b border-zinc-800">
                🌍 Show All Locations
              </SelectItem>
              
              <SelectGroup>
                <SelectLabel className="text-yellow-500 text-xs uppercase tracking-wider mt-2">Las Vegas (NV)</SelectLabel>
                <SelectItem value="vegas" className="pl-4 font-bold text-white">All Vegas</SelectItem>
                <SelectItem value="vegas shop" className="pl-8 text-sm">🏭 Shop Only</SelectItem>
                <SelectItem value="nellis" className="pl-8 text-sm">🏜️ Nellis Dunes</SelectItem>
              </SelectGroup>

              <SelectGroup>
                <SelectLabel className="text-cyan-500 text-xs uppercase tracking-wider mt-2">Pismo Beach (CA)</SelectLabel>
                <SelectItem value="pismo" className="pl-4 font-bold text-white">All Pismo</SelectItem>
                <SelectItem value="pismo shop" className="pl-8 text-sm">🏭 Shop Only</SelectItem>
                <SelectItem value="pismo beach" className="pl-8 text-sm">🏖️ Beach Stand</SelectItem>
                <SelectItem value="pismo dunes" className="pl-8 text-sm">🏜️ Dunes</SelectItem>
              </SelectGroup>

              <SelectGroup>
                <SelectLabel className="text-green-500 text-xs uppercase tracking-wider mt-2">Silver Lake (MI)</SelectLabel>
                <SelectItem value="silver lake" className="pl-4 font-bold text-white">All Michigan</SelectItem>
              </SelectGroup>

              <SelectGroup>
                <SelectLabel className="text-zinc-500 text-xs uppercase tracking-wider mt-2">Other</SelectLabel>
                <SelectItem value="transit" className="pl-4">🚚 In Transit / Unknown</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: SUMMARY TABLE (Span 2) */}
        <div className="lg:col-span-2">
          <Card className="border-t-4 border-t-yellow-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Fleet Composition
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[100px]">Category</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status (Good / Bad)</TableHead>
                    <TableHead className="text-right">Reliability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* TOTAL ROW */}
                  <TableRow className="bg-slate-50 dark:bg-zinc-900 font-bold border-b-2 border-slate-200">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right text-base">
                      {filteredVehicles.length}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600">{filteredVehicles.filter(v => v.vehicle_status !== 'broken').length}</span>
                      <span className="text-slate-300 mx-2">/</span>
                      <span className="text-red-600">{filteredVehicles.filter(v => v.vehicle_status === 'broken').length}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {filteredVehicles.length > 0 
                        ? Math.round((filteredVehicles.filter(v => v.vehicle_status !== 'broken').length / filteredVehicles.length) * 100)
                        : 0}%
                    </TableCell>
                  </TableRow>

                  {/* ROWS */}
                  {Object.entries(vehicleStats).sort().map(([type, stats]) => {
                    const percentage = stats.total > 0 ? Math.round((stats.operational / stats.total) * 100) : 0;
                    const healthColor = percentage < 70 ? 'text-red-600 bg-red-50 dark:bg-red-950/20' : 'text-green-600';

                    return (
                      <TableRow key={type}>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {type}
                        </TableCell>
                        <TableCell className="text-right">
                          <button 
                            className="hover:underline font-medium text-blue-600"
                            onClick={() => openList(`${type}s`, stats.list)}
                          >
                            {stats.total}
                          </button>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          <span className="text-green-600">{stats.operational}</span>
                          <span className="text-slate-300 mx-1">|</span>
                          <span className="text-red-500">{stats.broken}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={`${healthColor} border-0`}>
                            {percentage}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: MAP (Span 1) */}
        <div className="lg:col-span-1 h-full min-h-[400px]">
          <div className="sticky top-4 h-full">
             <div className="border-4 border-white dark:border-zinc-800 shadow-xl rounded-xl overflow-hidden h-[500px]">
                <MapComponent vehicles={filteredVehicles} />
             </div>
             <div className="mt-2 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Live GPS Feed
                </p>
             </div>
          </div>
        </div>

      </div>

      {/* DRILL DOWN DIALOG */}
      <DialogFactory
        title={dialogState.title}
        description={`Detailed list of ${dialogState.vehicles.length} units in ${getLocationLabel(selectedLocation)}.`}
        isDialogOpen={dialogState.isOpen}
        setIsDialogOpen={(open) => setDialogState(prev => ({ ...prev, isOpen: open }))}
      >
        <VehiclesLister vehicles={dialogState.vehicles} />
      </DialogFactory>

    </div>
  );
}