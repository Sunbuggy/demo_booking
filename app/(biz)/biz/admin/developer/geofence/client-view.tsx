'use client';

import React, { useState, useEffect } from 'react';
import { Geofence } from '@/lib/fleet/geofencing';
import { createGeofence, deleteGeofence, updateGeofence } from '@/app/actions/geofence-manager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Map as MapIcon, MapPin, Edit, Save, Plus, X, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import dynamic from 'next/dynamic';

// -----------------------------------------------------------------------------
// DYNAMIC MAP IMPORT
// We lazy load this so it doesn't break Server Side Rendering (SSR)
// -----------------------------------------------------------------------------
const GeofenceMap = dynamic(
  () => import('./geofence-map').then((mod) => mod.GeofenceMap),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-64 w-full bg-slate-100 dark:bg-zinc-800 animate-pulse rounded-md flex items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mr-2" /> Loading Map...
      </div>
    ) 
  }
);

interface GeofenceClientViewProps {
  initialGeofences: Geofence[];
}

export default function GeofenceClientView({ initialGeofences }: GeofenceClientViewProps) {
  const [geofences, setGeofences] = useState<Geofence[]>(initialGeofences);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  
  // FORM STATE (Controlled Component)
  // We use state here so the Map can update live as you type, and vice versa
  const [formData, setFormData] = useState({
    name: '',
    type: 'point',
    lat: '',
    lng: '',
    radius: '0.5',
    polygon_json: ''
  });

  // Re-sync local state if Server Data changes (e.g. after a revalidatePath)
  useEffect(() => {
    setGeofences(initialGeofences);
  }, [initialGeofences]);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      type: 'point',
      lat: '',
      lng: '',
      radius: '0.5',
      polygon_json: ''
    });
  };

  const handleEdit = (geo: Geofence) => {
    setEditingId(geo.id!);
    
    // Populate form with existing data
    setFormData({
      name: geo.name,
      type: geo.type,
      lat: geo.center?.lat.toString() || '',
      lng: geo.center?.lng.toString() || '',
      radius: geo.radius_miles?.toString() || '0.5',
      polygon_json: geo.polygon ? JSON.stringify(geo.polygon) : ''
    });

    // Scroll to top to show user the editor
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to handle Server Action submission while keeping client state clean
  // We use the bind approach implicitly via the form action attribute logic below
  const handleSubmit = async (payload: FormData) => {
    if (editingId) {
      await updateGeofence(payload);
    } else {
      await createGeofence(payload);
    }
    resetForm();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        
      {/* ----------------------------------------------------------------------
          LEFT COLUMN: EDITOR & MAP
      ---------------------------------------------------------------------- */}
      <Card className={`lg:col-span-1 h-fit shadow-sm sticky top-6 transition-colors ${editingId ? 'border-orange-400 bg-orange-50/10' : 'border-blue-100 dark:border-blue-900'}`}>
        <CardHeader className="bg-slate-50 dark:bg-zinc-900/50 border-b flex flex-row justify-between items-center py-4">
          <CardTitle className="text-base flex items-center gap-2">
            {editingId ? 'Edit Geofence' : 'Add New Geofence'}
            {editingId && <Badge variant="outline" className="text-orange-600 bg-orange-100 border-orange-200">EDITING</Badge>}
          </CardTitle>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={resetForm} className="h-8 w-8 p-0 text-slate-500 hover:text-red-500">
              <X size={16} />
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="pt-6">
          <form action={handleSubmit} key={editingId || 'new'}>
            
            {/* Hidden ID field is required for Update Action */}
            <input type="hidden" name="id" value={editingId || ''} />
            
            <div className="space-y-4">
              
              {/* Name Input */}
              <div className="space-y-2">
                <Label>Location Name</Label>
                <Input 
                  name="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Pismo Dunes Deep" 
                  required 
                />
              </div>

              {/* Type Selector */}
              <div className="space-y-2">
                <Label>Type</Label>
                <select 
                  name="type" 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="point">Radius Point (Simple)</option>
                  <option value="polygon">Polygon (Complex)</option>
                </select>
              </div>

              {/* LIVE MAP VISUALIZATION */}
              {/* Passing form data to the map allows the map to preview what is being typed */}
              <div className="rounded-md overflow-hidden border shadow-inner">
                <GeofenceMap 
                   data={formData} 
                   activeType={formData.type as 'point' | 'polygon'} 
                />
              </div>

              {/* CONDITIONAL: Point Config */}
              {formData.type === 'point' && (
                <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-md border space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 mb-2">
                     <MapPin size={14} className="text-blue-500" />
                     <span className="text-xs font-bold text-muted-foreground uppercase">Point Config</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Lat</Label>
                      <Input 
                        name="lat" 
                        value={formData.lat} 
                        onChange={(e) => setFormData({...formData, lat: e.target.value})}
                        className="font-mono text-xs" 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Lng</Label>
                      <Input 
                        name="lng" 
                        value={formData.lng} 
                        onChange={(e) => setFormData({...formData, lng: e.target.value})}
                        className="font-mono text-xs" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Radius (Miles)</Label>
                    <Input 
                      name="radius" 
                      value={formData.radius} 
                      onChange={(e) => setFormData({...formData, radius: e.target.value})}
                      className="font-mono text-xs" 
                    />
                  </div>
                </div>
              )}

              {/* CONDITIONAL: Polygon Config */}
              {formData.type === 'polygon' && (
                <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-md border space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                   <div className="flex items-center gap-2 mb-2">
                     <MapIcon size={14} className="text-purple-500" />
                     <span className="text-xs font-bold text-muted-foreground uppercase">Polygon Config</span>
                  </div>
                   <div className="space-y-1">
                      <Label className="text-xs">JSON Coordinates Array</Label>
                      <Textarea 
                        name="polygon_json" 
                        value={formData.polygon_json}
                        onChange={(e) => setFormData({...formData, polygon_json: e.target.value})}
                        placeholder='[{"lat":35.11,"lng":-120.64}, ...]' 
                        className="font-mono text-xs h-32 resize-y"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Use <a href="https://geojson.io" target="_blank" className="underline text-blue-500 hover:text-blue-600">geojson.io</a> to draw complex shapes.
                      </p>
                   </div>
                </div>
              )}

              <Button type="submit" className="w-full gap-2" variant={editingId ? "default" : "secondary"}>
                {editingId ? <Save size={16} /> : <Plus size={16} />}
                {editingId ? 'Update Geofence' : 'Create Geofence'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------------
          RIGHT COLUMN: LIST VIEW
      ---------------------------------------------------------------------- */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Active Definitions 
            <Badge variant="outline">{geofences.length}</Badge>
          </h2>
          {editingId && (
            <Button variant="outline" size="sm" onClick={resetForm} className="text-xs h-8">
              Cancel Edit Mode
            </Button>
          )}
        </div>
        
        <div className="grid gap-3">
          {geofences.map((geo) => (
            <div 
              key={geo.id} 
              className={`flex items-center justify-between p-4 border rounded-lg transition-all group ${
                editingId === geo.id 
                  ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800 ring-1 ring-orange-400' 
                  : 'bg-card hover:bg-slate-50 dark:hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon Box */}
                <div className={`p-2.5 rounded-lg shrink-0 ${geo.type === 'point' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20'}`}>
                  {geo.type === 'point' ? <MapPin size={20} /> : <MapIcon size={20} />}
                </div>
                
                {/* Details (Click to Edit) */}
                <div className="cursor-pointer flex-1" onClick={() => handleEdit(geo)}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">{geo.name}</h3>
                    <Badge variant="secondary" className="text-[10px] uppercase h-5 tracking-wide">{geo.type}</Badge>
                  </div>
                  
                  {geo.type === 'point' ? (
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {geo.center?.lat.toFixed(4)}, {geo.center?.lng.toFixed(4)} 
                        <span className="ml-2 text-slate-300">|</span> 
                        <span className="ml-2">Radius: {geo.radius_miles}mi</span>
                      </p>
                  ) : (
                      <p className="text-xs text-muted-foreground font-mono mt-1 truncate max-w-[300px] text-ellipsis">
                        {geo.polygon?.length} Vertices defined
                      </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-100 lg:opacity-60 lg:group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleEdit(geo)}
                  title="Edit Geofence"
                  className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Edit size={16} />
                </Button>

                <form action={deleteGeofence.bind(null, geo.id!)}>
                  <Button variant="ghost" size="icon" title="Delete Geofence" className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 size={16} />
                  </Button>
                </form>
              </div>
            </div>
          ))}
          
          {geofences.length === 0 && (
             <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50/50">
               <p>No geofences found.</p>
               <p className="text-xs mt-1">Create one using the form on the left.</p>
             </div>
          )}
        </div>
      </div>

    </div>
  );
}