// app/biz/pismo-pricing/page.tsx
// Pismo Pricing Rules Admin Page (Managers Only)

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

/**
 * CONSTANT: TYPE_ORDER
 * We use an "Index Signature" { [key: string]: number } here.
 * The Index Signature tells TS: "It's okay to use ANY string to look up a number in this object."
 */
const TYPE_ORDER: { [key: string]: number } = {
  ATV: 1,
  UTV: 2,
  Buggy: 3,
};

const ALL_PREFIXES = [
  'QA', 'QB', 'QC', 'QD', 'QE', 'QF', 'QG', 'QH', 'QI', 'QJ', 'QK', 'QL', 'QM', 'QN', 'QO', 'QP', 'QQ', 'QR', 'QS', 'QT', 'QU', 'QV', 'QW', 'QX', 'QY', 'QZ',
  'SB1', 'SB2', 'SB4', 'SB5', 'SB6',
  'UW2', 'UW4', 'UZ2', 'UZ4', 'UM2', 'UM4', 'UU2', 'UU4', 'UV6',
];

export default function PismoPricingAdmin() {
  // State management
  const [rules, setRules] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [selectedPrefixes, setSelectedPrefixes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // AUTH CHECK & INITIAL DATA FETCH
  useEffect(() => {
    const init = async () => {
      // 1. Get the authenticated user from the session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signin');
        return;
      }

      // 2. Fetch the user's profile to check their role level
      const { data: profile } = await supabase
        .from('users')
        .select('user_level, full_name')
        .eq('id', user.id)
        .single();

      // 3. Security Check: Must be level 650 or higher
      if (!profile || profile.user_level < 650) {
        alert('Access denied: Managers only');
        router.push('/biz');
        return;
      }

      setCurrentUser({ id: user.id, name: profile.full_name || user.email });

      // 4. Fetch the actual pricing rules
      const { data } = await supabase
        .from('pismo_pricing_rules')
        .select('*')
        .order('created_at', { ascending: false });

      setRules(data || []);
      setLoading(false);
    };

    init();
  }, [router, supabase]); // Dependencies ensure this only runs once on mount

  // HELPER: Initialize the edit form
  const startEdit = (rule: any) => {
    setEditingRule({ ...rule });
    setSelectedPrefixes(rule.fleet_prefixes || []);
  };

  // HELPER: Save to Supabase (Insert or Update)
  const saveRule = async () => {
    // Basic validation
    if (!editingRule || !editingRule.vehicle_name || selectedPrefixes.length === 0) {
      alert('Vehicle name and at least one fleet prefix required');
      return;
    }

    setSaving(true);

    // Prepare the payload for the database
    const payload = {
      ...editingRule,
      fleet_prefixes: selectedPrefixes,
      // Track who made the change based on whether it's an update or new insert
      ...(editingRule.id ? {
        updated_by: currentUser.id,
        updated_by_name: currentUser.name,
      } : {
        created_by: currentUser.id,
        created_by_name: currentUser.name,
      })
    };

    // Execute the query
    const { error } = editingRule.id
      ? await supabase.from('pismo_pricing_rules').update(payload).eq('id', editingRule.id)
      : await supabase.from('pismo_pricing_rules').insert(payload);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      // Refresh the list immediately after saving to show changes
      const { data } = await supabase
        .from('pismo_pricing_rules')
        .select('*')
        .order('created_at', { ascending: false });
      setRules(data || []);
      setEditingRule(null);
      setSelectedPrefixes([]);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-2xl text-foreground">Checking access...</div>;

  /**
   * DATA TRANSFORMATION: Grouping
   */
  const grouped = rules.reduce((acc, rule) => {
    const type = rule.type_vehicle || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(rule);
    return acc;
  }, {} as Record<string, any[]>);

  /**
   * DATA TRANSFORMATION: Sorting Keys
   */
  const sortedTypes = Object.keys(grouped).sort((a, b) => 
    (TYPE_ORDER[a] || 99) - (TYPE_ORDER[b] || 99)
  );

  /**
   * FIX: Explicit 'any' Typing in Sort
   */
  sortedTypes.forEach(type => {
    grouped[type].sort((a: any, b: any) => (a.sort_order || 100) - (b.sort_order || 100));
  });

  return (
    // SEMANTIC: Page background and default text color
    <div className="max-w-7xl mx-auto p-8 bg-background text-foreground min-h-screen">
      
      {/* SEMANTIC: Primary Brand Color for Main Title */}
      <h1 className="text-4xl font-bold text-primary mb-4 text-center">
        Pismo Pricing Rules Admin (Managers Only)
      </h1>
      
      {/* SEMANTIC: Muted text for secondary info */}
      <p className="text-center mb-8 text-muted-foreground">
        Logged in as: {currentUser?.name}
      </p>

      {/* Control Buttons */}
      <div className="flex justify-center gap-4 mb-12">
        <button
          onClick={() => {
            // Reset form for a new rule
            setEditingRule({
              vehicle_name: '',
              seats: 1,
              price_1hr: 0,
              price_1_5hr: 0,
              price_2hr: 0,
              price_2_5hr: 0,
              price_3hr: 0,
              price_3_5hr: 0,
              price_4hr: 0,
              online: true,
              phone: true,
              type_vehicle: 'ATV',
              belt: 0,
              damage_waiver: 0,
              deposit: 0,
              fleet_prefixes: [],
              sort_order: 100,
              start_date: new Date().toISOString().split('T')[0],
              end_date: null,
              days_of_week: [1,2,3,4,5,6,7],
              start_time: null,
              end_time: null,
            });
            setSelectedPrefixes([]);
          }}
          // SEMANTIC: Success/Green action
          className="bg-green-600 text-white hover:bg-green-700 px-8 py-4 rounded text-2xl shadow-md transition-colors"
        >
          + Add New Rule
        </button>
        <button
          onClick={async () => {
            const { data } = await supabase.from('pismo_pricing_rules').select('*').order('created_at', { ascending: false });
            setRules(data || []);
          }}
          // SEMANTIC: Primary/Blue action
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded text-2xl shadow-md transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Render the grouped sections */}
      {sortedTypes.map(type => (
        <div key={type} className="mb-16">
          <h2 className="text-3xl font-bold text-primary mb-8 text-center border-b border-border pb-4">
            {type === 'Buggy' ? 'Buggies' : type + 's'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {grouped[type].map((rule: any) => (
              // SEMANTIC: Card styling (bg-card, border-border)
              <div key={rule.id} className="bg-card text-card-foreground p-8 rounded-2xl shadow-sm border border-border flex flex-col h-full">
                <h3 className="text-3xl font-bold text-primary mb-6 text-center">
                  {rule.vehicle_name}
                </h3>
                <p className="text-xl text-center mb-6 text-muted-foreground">
                  Seats: {rule.seats}
                </p>

                {/* Price Grid */}
                <div className="space-y-3 mb-8 text-lg flex-grow">
                  <div className="grid grid-cols-2 border-b border-border pb-1"><span className="font-semibold">1hr:</span> <span className="text-right">${rule.price_1hr}</span></div>
                  <div className="grid grid-cols-2 border-b border-border pb-1"><span className="font-semibold">1.5hr:</span> <span className="text-right">${rule.price_1_5hr}</span></div>
                  <div className="grid grid-cols-2 border-b border-border pb-1"><span className="font-semibold">2hr:</span> <span className="text-right">${rule.price_2hr}</span></div>
                  <div className="grid grid-cols-2 border-b border-border pb-1"><span className="font-semibold">2.5hr:</span> <span className="text-right">${rule.price_2_5hr}</span></div>
                  <div className="grid grid-cols-2 border-b border-border pb-1"><span className="font-semibold">3hr:</span> <span className="text-right">${rule.price_3hr}</span></div>
                  <div className="grid grid-cols-2 border-b border-border pb-1"><span className="font-semibold">3.5hr:</span> <span className="text-right">${rule.price_3_5hr}</span></div>
                  <div className="grid grid-cols-2"><span className="font-semibold">4hr:</span> <span className="text-right">${rule.price_4hr}</span></div>
                </div>

                <div className="bg-muted p-4 rounded-lg mb-4 text-sm">
                  <strong>Prefixes:</strong> {rule.fleet_prefixes?.join(', ')}
                </div>
                
                <p className="mb-4 text-lg font-semibold text-primary">
                  <strong>Sort Order:</strong> {rule.sort_order ?? 100}
                  <span className="block text-sm font-normal text-muted-foreground mt-1">
                    (lower number = appears higher on booking page)
                  </span>
                </p>

                <p className="mb-4 text-sm text-foreground"><strong>Active:</strong> {rule.start_date} → {rule.end_date || 'Ongoing'}</p>
                <p className="text-xs text-muted-foreground mb-6">
                  Created by: {rule.created_by_name || rule.created_by}<br />
                  {rule.updated_by && `Updated by: ${rule.updated_by_name || rule.updated_by}`}
                </p>

                <button
                  onClick={() => startEdit(rule)}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 py-4 rounded-lg text-xl font-bold transition-colors mt-auto"
                >
                  Edit Rule
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Editing Modal Overlay */}
      {editingRule && (
        // SEMANTIC: Overlay background
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card text-card-foreground rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-border">
            <div className="p-8 border-b border-border text-center bg-muted/30">
              <h2 className="text-3xl font-bold text-primary">
                {editingRule.id ? 'Edit' : 'New'} Pricing Rule
              </h2>
            </div>

            {/* Scrollable Form Area */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xl mb-2 text-muted-foreground">Vehicle Name</label>
                  <input
                    type="text"
                    value={editingRule.vehicle_name}
                    onChange={e => setEditingRule({ ...editingRule, vehicle_name: e.target.value })}
                    // SEMANTIC: Input styling
                    className="p-4 bg-background border border-input rounded w-full text-xl focus:ring-2 focus:ring-ring focus:outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xl mb-2 text-muted-foreground">Seats</label>
                  <input 
                    type="number" 
                    value={editingRule.seats} 
                    onChange={e => setEditingRule({ ...editingRule, seats: parseInt(e.target.value) || 1 })} 
                    className="p-4 bg-background border border-input rounded w-full text-xl focus:ring-2 focus:ring-ring focus:outline-none text-foreground" 
                  />
                </div>
                <div>
                  <label className="block text-xl mb-2 text-muted-foreground">Type</label>
                  <select 
                    value={editingRule.type_vehicle} 
                    onChange={e => setEditingRule({ ...editingRule, type_vehicle: e.target.value })} 
                    className="p-4 bg-background border border-input rounded w-full text-xl focus:ring-2 focus:ring-ring focus:outline-none text-foreground"
                  >
                    <option>ATV</option><option>UTV</option><option>Buggy</option>
                  </select>
                </div>
                
                {/* Price Inputs */}
                {['1hr','1_5hr','2hr','2_5hr','3hr','3_5hr','4hr'].map((duration) => (
                   <div key={duration}>
                     <label className="block text-xl mb-2 text-muted-foreground">{duration.replace('_', '.')} Price</label>
                     <input 
                       type="number" 
                       step="0.01" 
                       value={editingRule[`price_${duration}`]} 
                       onChange={e => setEditingRule({ ...editingRule, [`price_${duration}`]: parseFloat(e.target.value) || 0 })} 
                       className="p-4 bg-background border border-input rounded w-full text-xl focus:ring-2 focus:ring-ring focus:outline-none text-foreground" 
                      />
                   </div>
                ))}

                <div>
                  <label className="block text-xl mb-2 text-muted-foreground">Sort Order</label>
                  <input 
                    type="number" 
                    value={editingRule.sort_order} 
                    onChange={e => setEditingRule({ ...editingRule, sort_order: parseInt(e.target.value) || 100 })} 
                    className="p-4 bg-background border border-input rounded w-full text-xl focus:ring-2 focus:ring-ring focus:outline-none text-foreground" 
                  />
                </div>
                <div>
                  <label className="block text-xl mb-2 text-muted-foreground">Online</label>
                  <select 
                    value={editingRule.online ? 'true' : 'false'} 
                    onChange={e => setEditingRule({ ...editingRule, online: e.target.value === 'true' })} 
                    className="p-4 bg-background border border-input rounded w-full text-xl focus:ring-2 focus:ring-ring focus:outline-none text-foreground"
                  >
                    <option value="true">Yes</option><option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xl mb-2 text-muted-foreground">Phone</label>
                  <select 
                    value={editingRule.phone ? 'true' : 'false'} 
                    onChange={e => setEditingRule({ ...editingRule, phone: e.target.value === 'true' })} 
                    className="p-4 bg-background border border-input rounded w-full text-xl focus:ring-2 focus:ring-ring focus:outline-none text-foreground"
                  >
                    <option value="true">Yes</option><option value="false">No</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xl mb-2 text-muted-foreground">Fleet Prefixes</label>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-4 max-h-60 overflow-y-auto p-4 bg-muted border border-border rounded">
                    {ALL_PREFIXES.map(prefix => (
                      <label key={prefix} className="flex items-center cursor-pointer hover:text-primary transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedPrefixes.includes(prefix)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedPrefixes(prev => [...prev, prefix]);
                            } else {
                              setSelectedPrefixes(prev => prev.filter(p => p !== prefix));
                            }
                          }}
                          className="mr-2 h-5 w-5 accent-primary"
                        />
                        {prefix}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-border text-center space-x-6 bg-muted/30">
              <button 
                onClick={saveRule} 
                disabled={saving} 
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded text-2xl disabled:opacity-50 transition-colors shadow-md"
              >
                {saving ? 'Saving...' : 'Save Rule'}
              </button>
              <button 
                onClick={() => { setEditingRule(null); setSelectedPrefixes([]); }} 
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-8 py-4 rounded text-2xl transition-colors shadow-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}