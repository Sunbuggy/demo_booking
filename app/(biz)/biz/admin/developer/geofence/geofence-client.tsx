'use client';

import React, { useState, useEffect } from 'react';
import { Geofence } from '@/lib/fleet/geofencing';
import { createGeofence, deleteGeofence, updateGeofence } from '@/app/actions/geofence-manager'; // We need to add updateGeofence
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Map as MapIcon, MapPin, Edit, Save, Plus, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import dynamic from 'next/dynamic';

// Dynamic Import for Map (Leaflet)
const GeofenceMap = dynamic(
  () => import('./geofence-map').then((mod) => mod.GeofenceMap),
  { ssr: false, loading: () => <div className="h-64 bg-slate-100 dark:bg-zinc-800 animate-pulse rounded-md" /> }
);

interface GeofenceClientProps {
  initialGeofences: Geofence[];
}

export default function GeofenceClient({ initialGeofences }: GeofenceClientProps) {
  const [geofences, setGeofences] = useState<Geofence[]>(initialGeofences);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'point',
    lat: '',
    lng: '',
    radius: '0.5',
    polygon_json: ''
  });

  // Sync state when props change (revalidation)
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
    setFormData({
      name: geo.name,
      type: geo.type,
      lat: geo.center?.lat.toString() || '',
      lng: geo.center?.lng.toString() || '',
      radius: geo.radius_miles?.toString() || '0.5',
      polygon_json: geo.polygon ? JSON.stringify(geo.polygon) : ''
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
      {/* LEFT COLUMN: EDITOR */}
      <Card className="lg:col-span-1 h-fit border-blue-100 dark:border-blue-900 shadow-sm sticky top-6">
        <CardHeader className="bg-slate-50 dark:bg-zinc-900/50 border-b flex flex-row justify-between items-center">
          <CardTitle className="text-base">
            {editingId ? 'Edit Geofence' : 'Add New Geofence'}
          </CardTitle>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={resetForm} className="h-8 w-8 p-0">
              <X size={16} />
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          {/* This form uses a Server Action, but we wrap it 
              to inject the 'id' if we are editing.
          */}
          <form action={editingId ? updateGeofence : createGeofence} key={editingId || 'new'}>
            <input type="hidden" name="id" value={editingId || ''} />
            
            <div className="space-y-4">
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

              {/* LIVE MAP PREVIEW */}
              <div className="rounded-md overflow-hidden border">
                <GeofenceMap 
                   data={formData} 
                   activeType={formData.type as 'point' | 'polygon'} 
                />
              </div>

              {/* Point Config */}
              {formData.type === 'point' && (
                <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-md border space-y-4">
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

              {/* Polygon Config */}
              {formData.type === 'polygon' && (
                <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-md border space-y-4">
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
                        className="font-mono text-xs h-24 resize-y"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Use <a href="https://geojson.io" target="_blank" className="underline text-blue-500 hover:text-blue-600">geojson.io</a> to draw.
                      </p>
                   </div>
                </div>
              )}

              <Button type="submit" className="w-full gap-2">
                {editingId ? <Save size={16} /> : <Plus size={16} />}
                {editingId ? 'Update Geofence' : 'Create Geofence'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* RIGHT COLUMN: LIST */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Active Definitions 
            <Badge variant="outline">{geofences.length}</Badge>
          </h2>
          {editingId && (
            <Button variant="outline" size="sm" onClick={resetForm} className="text-xs h-8">
              Cancel Edit
            </Button>
          )}
        </div>
        
        <div className="grid gap-3">
          {geofences.map((geo) => (
            <div 
              key={geo.id} 
              className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                editingId === geo.id 
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 ring-1 ring-blue-500' 
                  : 'bg-card hover:bg-slate-50 dark:hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-lg ${geo.type === 'point' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20'}`}>
                  {geo.type === 'point' ? <MapPin size={20} /> : <MapIcon size={20} />}
                </div>
                <div className="cursor-pointer" onClick={() => handleEdit(geo)}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">{geo.name}</h3>
                    <Badge variant="secondary" className="text-[10px] uppercase h-5">{geo.type}</Badge>
                  </div>
                  
                  {geo.type === 'point' ? (
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {geo.center?.lat.toFixed(4)}, {geo.center?.lng.toFixed(4)} 
                        <span className="ml-2 text-slate-400">|</span> 
                        <span className="ml-2">Radius: {geo.radius_miles}mi</span>
                      </p>
                  ) : (
                      <p className="text-xs text-muted-foreground font-mono mt-1 truncate max-w-[300px]">
                        {geo.polygon?.length} Vertices defined
                      </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleEdit(geo)}
                  className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Edit size={16} />
                </Button>

                <form action={deleteGeofence.bind(null, geo.id!)}>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 size={16} />
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}