'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Database, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { testMigration } from './actions';

export default function MigrationWorkbench() {
  const [resId, setResId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigrate = async () => {
    if (!resId) return;
    setIsLoading(true);
    setResult(null);
    setError(null);

    const response = await testMigration(Number(resId));
    
    if (response.success) {
      setResult(response);
    } else {
      setError(response.error || 'Unknown error occurred');
    }
    setIsLoading(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* HEADER */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
          <Database className="text-purple-600" />
          Legacy Migration <span className="text-zinc-400">Workbench</span>
        </h1>
        <p className="text-zinc-500 max-w-2xl">
          Use this tool to manually test the "Strangler Fig" migration logic on a single reservation.
          It reads from MySQL `reservations_modified` and writes to Supabase (3-Layer Schema).
        </p>
      </div>

      {/* CONTROL PANEL */}
      <Card className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
        <CardContent className="pt-6 flex gap-4 items-end">
          <div className="grid gap-2 w-full max-w-sm">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Legacy Reservation ID
            </label>
            <Input 
              placeholder="e.g. 54321" 
              value={resId} 
              onChange={(e) => setResId(e.target.value)}
              className="font-mono"
            />
          </div>
          <Button 
            onClick={handleMigrate} 
            disabled={isLoading || !resId}
            className="bg-purple-600 hover:bg-purple-700 text-white min-w-[140px]"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            Run Migration
          </Button>
        </CardContent>
      </Card>

      {/* ERROR DISPLAY */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Migration Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* RESULTS DISPLAY */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* LEFT: LEGACY SOURCE */}
          <Card className="border-red-200 dark:border-red-900/50 shadow-sm">
            <CardHeader className="bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/50 pb-3">
              <CardTitle className="text-sm font-bold uppercase text-red-700 dark:text-red-400 flex items-center gap-2">
                <Database className="w-4 h-4" /> Source (MySQL)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <pre className="text-xs font-mono p-4 overflow-auto max-h-[500px] text-zinc-600 dark:text-zinc-300 bg-transparent">
                {JSON.stringify(result.legacyData, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* RIGHT: SUPABASE TARGET */}
          <Card className="border-green-200 dark:border-green-900/50 shadow-md ring-2 ring-green-500/20">
            <CardHeader className="bg-green-50 dark:bg-green-900/10 border-b border-green-100 dark:border-green-900/50 pb-3">
              <CardTitle className="text-sm font-bold uppercase text-green-700 dark:text-green-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Target (Supabase 3-Layer)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-zinc-100 dark:divide-zinc-800">
              
              {/* Layer 1: Header */}
              <div className="p-4">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Layer 1: Header</span>
                <div className="bg-zinc-950 text-green-400 rounded p-3 font-mono text-xs overflow-x-auto">
                  ID: {result.migratedData.id}<br/>
                  Legacy ID: {result.migratedData.legacy_id}<br/>
                  Status: {result.migratedData.status}
                </div>
              </div>

              {/* Layer 2: Participants */}
              <div className="p-4">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Layer 2: Manifest ({result.migratedData.booking_participants.length})</span>
                <div className="space-y-1">
                  {result.migratedData.booking_participants.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs border p-2 rounded bg-white dark:bg-zinc-900">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${p.role === 'PRIMARY_RENTER' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>
                        {p.role}
                      </span>
                      <span className="font-mono text-zinc-500">{p.temp_name || 'Linked User'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer 3: Resources */}
              <div className="p-4">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Layer 3: Fleet Assets ({result.migratedData.booking_resources.length})</span>
                <div className="flex flex-wrap gap-2">
                  {result.migratedData.booking_resources.map((r: any, i: number) => (
                    <span key={i} className="text-xs font-mono bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded border border-yellow-200 dark:border-yellow-800">
                      {r.vehicle_type_id}
                    </span>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}