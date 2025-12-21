// app/biz/pismo-pricing/page.tsx
// Pismo Pricing Rules Admin Page (Managers Only)
// This page allows managers (user_level >= 650) to create and edit pricing rules for Pismo rentals.
// Rules define:
// - Vehicle name and type (ATV, UTV, Buggy)
// - Hourly pricing
// - Fleet prefixes (which vehicles this rule applies to)
// - Sort order (lower = appears higher on public booking page)
// - Active date range and days of week
// - Online/phone booking availability
// - Additional fees (belt, damage waiver, deposit)
//
// Rules are grouped by vehicle type and sorted by TYPE_ORDER (ATV → UTV → Buggy)
// Within each type, rules are sorted by sort_order (lower number = higher on public page)
//
// The sort order is prominently displayed on each card so managers can see current ordering at a glance.

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

// Define the display order for vehicle types
// Using index signature allows safe string indexing while keeping type safety
const TYPE_ORDER: { [key: string]: number } = {
  ATV: 1,
  UTV: 2,
  Buggy: 3,
};

// All possible fleet prefixes — used for multi-select in edit modal
const ALL_PREFIXES = [
  'QA', 'QB', 'QC', 'QD', 'QE', 'QF', 'QG', 'QH', 'QI', 'QJ', 'QK', 'QL', 'QM', 'QN', 'QO', 'QP', 'QQ', 'QR', 'QS', 'QT', 'QU', 'QV', 'QW', 'QX', 'QY', 'QZ',
  'SB1', 'SB2', 'SB4', 'SB5', 'SB6',
  'UW2', 'UW4', 'UZ2', 'UZ4', 'UM2', 'UM4', 'UU2', 'UU4', 'UV6',
];

export default function PismoPricingAdmin() {
  const [rules, setRules] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [selectedPrefixes, setSelectedPrefixes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signin');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('user_level, full_name')
        .eq('id', user.id)
        .single();

      if (!profile || profile.user_level < 650) {
        alert('Access denied: Managers only');
        router.push('/biz');
        return;
      }

      setCurrentUser({ id: user.id, name: profile.full_name || user.email });

      const { data } = await supabase
        .from('pismo_pricing_rules')
        .select('*')
        .order('created_at', { ascending: false });

      setRules(data || []);
      setLoading(false);
    };

    init();
  }, [router, supabase]);

  const startEdit = (rule: any) => {
    setEditingRule({ ...rule });
    setSelectedPrefixes(rule.fleet_prefixes || []);
  };

  const saveRule = async () => {
    if (!editingRule || !editingRule.vehicle_name || selectedPrefixes.length === 0) {
      alert('Vehicle name and at least one fleet prefix required');
      return;
    }

    setSaving(true);

    const payload = {
      ...editingRule,
      fleet_prefixes: selectedPrefixes,
      ...(editingRule.id ? {
        updated_by: currentUser.id,
        updated_by_name: currentUser.name,
      } : {
        created_by: currentUser.id,
        created_by_name: currentUser.name,
      })
    };

    const { error } = editingRule.id
      ? await supabase.from('pismo_pricing_rules').update(payload).eq('id', editingRule.id)
      : await supabase.from('pismo_pricing_rules').insert(payload);

    if (error) {
      alert('Error: ' + error.message);
    } else {
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

  if (loading) return <div className="p-8 text-center text-2xl">Checking access...</div>;

  // Group rules by type_vehicle
  const grouped = rules.reduce((acc, rule) => {
    const type = rule.type_vehicle || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(rule);
    return acc;
  }, {} as Record<string, any[]>);

  // Sort types according to TYPE_ORDER
  const sortedTypes = Object.keys(grouped).sort((a, b) => 
    (TYPE_ORDER[a] || 99) - (TYPE_ORDER[b] || 99)
  );

  // Sort rules within each type by sort_order
  sortedTypes.forEach(type => {
    grouped[type].sort((a: any, b: any) => (a.sort_order || 100) - (b.sort_order || 100));
  });

  return (
    <div className="max-w-7xl mx-auto p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-4xl font-bold text-orange-500 mb-4 text-center">Pismo Pricing Rules Admin (Managers Only)</h1>
      <p className="text-center mb-8">Logged in as: {currentUser?.name}</p>

      <div className="flex justify-center gap-4 mb-12">
        <button
          onClick={() => {
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
          className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded text-2xl"
        >
          + Add New Rule
        </button>
        <button
          onClick={async () => {
            const { data } = await supabase.from('pismo_pricing_rules').select('*').order('created_at', { ascending: false });
            setRules(data || []);
          }}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded text-2xl"
        >
          Refresh
        </button>
      </div>

      {sortedTypes.map(type => (
        <div key={type} className="mb-16">
          <h2 className="text-3xl font-bold text-orange-400 mb-8 text-center">
            {type === 'Buggy' ? 'Buggies' : type + 's'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {grouped[type].map(rule => (
              <div key={rule.id} className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
                <h3 className="text-3xl font-bold text-orange-300 mb-6 text-center">
                  {rule.vehicle_name}
                </h3>
                <p className="text-xl text-center mb-6 text-gray-300">
                  Seats: {rule.seats}
                </p>

                <div className="space-y-3 mb-8 text-lg">
                  <div className="grid grid-cols-2">
                    <span className="font-semibold">1hr:</span> <span className="text-right">${rule.price_1hr}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-semibold">1.5hr:</span> <span className="text-right">${rule.price_1_5hr}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-semibold">2hr:</span> <span className="text-right">${rule.price_2hr}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-semibold">2.5hr:</span> <span className="text-right">${rule.price_2_5hr}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-semibold">3hr:</span> <span className="text-right">${rule.price_3hr}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-semibold">3.5hr:</span> <span className="text-right">${rule.price_3_5hr}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-semibold">4hr:</span> <span className="text-right">${rule.price_4hr}</span>
                  </div>
                </div>

                <p className="mb-2 text-sm"><strong>Prefixes:</strong> {rule.fleet_prefixes?.join(', ')}</p>
                
                <p className="mb-4 text-lg font-semibold text-yellow-300">
                  <strong>Sort Order:</strong> {rule.sort_order ?? 100}
                  <span className="block text-sm font-normal text-gray-400 mt-1">
                    (lower number = appears higher on booking page)
                  </span>
                </p>

                <p className="mb-4 text-sm"><strong>Active:</strong> {rule.start_date} → {rule.end_date || 'Ongoing'}</p>
                <p className="text-xs text-gray-400 mb-6">
                  Created by: {rule.created_by_name || rule.created_by}<br />
                  {rule.updated_by && `Updated by: ${rule.updated_by_name || rule.updated_by}`}
                </p>

                <button
                  onClick={() => startEdit(rule)}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-lg text-xl font-bold"
                >
                  Edit Rule
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Editing Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-gray-700 text-center">
              <h2 className="text-3xl font-bold">
                {editingRule.id ? 'Edit' : 'New'} Pricing Rule
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {/* Form fields — keep your existing JSX here */}
            </div>

            <div className="p-8 border-t border-gray-700 text-center space-x-6">
              <button onClick={saveRule} disabled={saving} className="bg-orange-600 hover:bg-orange-700 px-8 py-4 rounded text-2xl disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Rule'}
              </button>
              <button onClick={() => { setEditingRule(null); setSelectedPrefixes([]); }} className="bg-gray-600 hover:bg-gray-700 px-8 py-4 rounded text-2xl">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}