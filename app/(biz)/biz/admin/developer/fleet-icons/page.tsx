'use client';

import React, { useEffect, useState } from 'react';
import { getFleetIconSettings, updateFleetIcon, uploadCustomIcon } from '@/app/actions/fleet-settings';
import { AVAILABLE_ICONS } from '@/lib/fleet/icon-registry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, UploadCloud, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function FleetIconsAdminPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newType, setNewType] = useState('');

  // --- DATA LOADING ---
  const load = async () => {
    setLoading(true);
    const data = await getFleetIconSettings();
    setSettings(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // --- ACTIONS ---

  // 1. UPDATE EXISTING (Standard Icon)
  const handleUpdate = async (type: string, icon: string) => {
    try {
      await updateFleetIcon(type, icon);
      toast.success(`Updated ${type} to use ${icon}`);
      
      // Optimistic Local Update
      setSettings(prev => {
        const existing = prev.find(p => p.vehicle_type === type);
        if (existing) {
          return prev.map(p => p.vehicle_type === type ? { ...p, icon_name: icon } : p);
        } else {
          return [...prev, { vehicle_type: type, icon_name: icon }];
        }
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to update mapping');
    }
  };

  // 2. UPLOAD CUSTOM ICON (SVG/PNG)
  const handleFileUpload = async (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    // Toast Promise handles loading/success/error UI automatically
    toast.promise(uploadCustomIcon(formData), {
      loading: 'Uploading custom icon to Cloud...',
      success: (data) => {
        load(); // Reload entire list to fetch the new URL from DB
        return 'Icon uploaded & linked successfully!';
      },
      error: 'Upload failed. Check console.'
    });
  };

  // 3. CREATE NEW TYPE
  const handleCreateNew = () => {
    if (!newType) return;
    const cleanType = newType.toLowerCase().trim();
    
    // Check if exists
    if (settings.find(s => s.vehicle_type === cleanType)) {
      toast.error('Type already exists');
      return;
    }

    handleUpdate(cleanType, 'HelpCircle');
    setNewType('');
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 text-zinc-400">
        <Loader2 className="animate-spin w-8 h-8" />
        <p>Loading Configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-40">
      
      {/* HEADER NAV */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Link href="/biz/admin/developer/docs" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-blue-600 transition-colors mb-2">
            <ArrowLeft size={16} /> Back to Developer Docs
          </Link>
          <h1 className="text-4xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
            Fleet Icon <span className="text-blue-600">Configuration</span>
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Map database <code>vehicle_type</code> strings to visual icons. 
            Supports standard <strong>Lucide Library</strong> or <strong>Custom SVG Uploads</strong>.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* MAIN MAPPING LIST */}
      <Card className="shadow-lg border-zinc-200 dark:border-zinc-800">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle>Active Mappings ({settings.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-zinc-100 dark:divide-zinc-800">
          
          {settings.map((setting) => {
            // Determine if using Custom URL or Standard Lib
            const isCustom = setting.icon_name.startsWith('http') || setting.icon_name.startsWith('/');
            
            // Resolve the Lucide Component (if standard)
            const StandardIcon = AVAILABLE_ICONS[setting.icon_name] || AVAILABLE_ICONS['HelpCircle'];
            
            return (
              <div key={setting.vehicle_type} className="py-4 flex items-center justify-between group hover:bg-zinc-50 dark:hover:bg-zinc-900/30 -mx-6 px-6 transition-colors">
                
                {/* LEFT: VISUAL PREVIEW & NAME */}
                <div className="flex items-center gap-5">
                  <div className="relative w-14 h-14 bg-white dark:bg-zinc-950 border rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
                    {isCustom ? (
                      <img 
                        src={setting.icon_name} 
                        alt={setting.vehicle_type} 
                        className="w-8 h-8 object-contain" 
                      />
                    ) : (
                      <StandardIcon className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-lg capitalize text-zinc-800 dark:text-zinc-200">
                      {setting.vehicle_type}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
                      <span>Source: {isCustom ? 'Custom Upload' : 'Standard Library'}</span>
                      {isCustom && (
                        <span className="text-blue-500 font-bold px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded">SVG</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT: CONTROLS */}
                <div className="flex items-center gap-3">
                  
                  {/* A. STANDARD SELECTOR */}
                  <div className="w-[220px]">
                    <Select 
                      value={!isCustom ? setting.icon_name : undefined} 
                      onValueChange={(val) => handleUpdate(setting.vehicle_type, val)}
                    >
                      <SelectTrigger className="bg-white dark:bg-zinc-900">
                        <SelectValue placeholder={isCustom ? "Using Custom Icon" : "Select Standard Icon"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {Object.keys(AVAILABLE_ICONS).map((iconName) => (
                          <SelectItem key={iconName} value={iconName}>
                            <div className="flex items-center gap-2">
                               {/* Render icon in dropdown for better UX */}
                               {React.createElement(AVAILABLE_ICONS[iconName], { size: 14 })}
                               <span>{iconName}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <span className="text-[10px] uppercase font-bold text-zinc-300">OR</span>

                  {/* B. CUSTOM UPLOAD BUTTON */}
                  <div className="relative group/upload">
                    <Input 
                      type="file" 
                      accept=".svg,.png,.webp" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                      onChange={(e) => handleFileUpload(setting.vehicle_type, e)}
                    />
                    <Button variant="outline" size="icon" className="w-10 h-10 border-dashed border-zinc-300 hover:border-blue-500 hover:bg-blue-50 text-zinc-500 hover:text-blue-600 transition-all">
                      <UploadCloud className="w-4 h-4" />
                    </Button>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover/upload:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Upload Custom SVG
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </CardContent>
      </Card>
      
      {/* FOOTER: ADD NEW TYPE */}
      <Card className="bg-zinc-50 dark:bg-zinc-900/20 border-dashed border-2 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Add New Vehicle Type</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
           <Input 
             className="max-w-md bg-white dark:bg-zinc-950"
             placeholder="e.g. 'hovercraft' or 'jet-ski'" 
             value={newType} 
             onChange={(e) => setNewType(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()} 
           />
           <Button onClick={handleCreateNew} disabled={!newType}>
             Create Mapping
           </Button>
        </CardContent>
      </Card>

    </div>
  );
}