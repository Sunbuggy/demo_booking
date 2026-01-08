'use client';

import { useState } from 'react';
import { LayoutGrid, List as ListIcon } from 'lucide-react';

export default function VehicleGrid({ categories, selections, setSelections, durationHours }: any) {
  // NEW: State to control the view layout
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const updateSelection = (id: string, qty: number, waiver: boolean) => {
    setSelections((prev: any) => ({ ...prev, [id]: { qty, waiver } }));
  };

  return (
    <section className="mb-12">
      
      {/* Header Row with View Toggles */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 px-2">
        <h2 className="text-3xl font-bold text-white mb-4 md:mb-0">4. Select Vehicles</h2>
        
        {/* Toggle Buttons */}
        <div className="flex items-center bg-gray-800 p-1 rounded-lg border border-gray-700">
            <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                title="List View"
            >
                <ListIcon size={24} />
            </button>
            <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                title="Grid View"
            >
                <LayoutGrid size={24} />
            </button>
        </div>
      </div>

      {/* Container: Toggles between CSS Grid and Flex Column */}
      <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "flex flex-col gap-4"
      }>
        {categories.map((cat: any) => {
          const qty = selections[cat.id]?.qty || 0;
          const isSelected = qty > 0;
          const price = cat[`price_${durationHours}hr`] || cat.price_1hr;

          return (
            <div 
              key={cat.id} 
              className={`
                transition-all duration-200 shadow-xl
                ${viewMode === 'grid' 
                    ? 'p-6 rounded-2xl flex flex-col h-full' // Grid Styles
                    : 'p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between' // List Styles
                }
                ${isSelected 
                  ? 'bg-gray-800 border-2 border-orange-500 ring-4 ring-orange-500/20' 
                  : 'bg-gray-800 border border-transparent hover:bg-gray-750'
                }
              `}
            >
              
              {/* --- INFO SECTION --- */}
              <div className={viewMode === 'list' ? 'md:flex-1 md:pr-8 mb-4 md:mb-0' : 'mb-4 text-center'}>
                <h4 className={`font-bold ${
                    viewMode === 'grid' ? 'text-2xl mb-2' : 'text-xl'
                } ${isSelected ? 'text-orange-400' : 'text-white'}`}>
                  {cat.vehicle_name}
                </h4>
                <p className={`text-gray-400 ${viewMode === 'grid' ? 'text-xl' : 'text-sm'}`}>
                  ${price} / {durationHours}hr
                </p>
              </div>
              
              {/* --- CONTROLS SECTION --- */}
              <div className={`${viewMode === 'grid' ? 'mt-auto space-y-4' : 'flex flex-col md:flex-row items-center gap-4'}`}>
                
                {/* Quantity Controls */}
                <div className={`flex items-center justify-between rounded p-1 
                    ${isSelected ? 'bg-orange-900/30' : 'bg-gray-700'}
                    ${viewMode === 'list' ? 'w-full md:w-auto gap-2' : 'w-full'}
                `}>
                   <button 
                     type="button"
                     onClick={() => updateSelection(cat.id, Math.max(0, qty - 1), selections[cat.id]?.waiver)}
                     className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-gray-600 rounded text-white font-bold hover:bg-gray-500 transition-colors"
                   >-</button>
                   
                   <input 
                      type="number" 
                      min="0" 
                      value={qty} 
                      onChange={e => updateSelection(cat.id, parseInt(e.target.value) || 0, selections[cat.id]?.waiver)}
                      className={`bg-transparent text-center font-bold focus:outline-none text-white appearance-none [&::-webkit-inner-spin-button]:appearance-none
                        ${viewMode === 'grid' ? 'w-full text-xl' : 'w-12 text-lg'}
                      `}
                   />
                   
                   <button 
                     type="button"
                     onClick={() => updateSelection(cat.id, qty + 1, selections[cat.id]?.waiver)}
                     className={`w-10 h-10 flex items-center justify-center flex-shrink-0 rounded text-white font-bold transition-colors ${isSelected ? 'bg-orange-600 hover:bg-orange-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                   >+</button>
                </div>
                
                {/* Waiver Checkbox */}
                <label className={`
                    flex items-center text-sm p-3 rounded cursor-pointer border transition-colors select-none
                    ${viewMode === 'list' ? 'w-full md:w-auto whitespace-nowrap' : 'w-full'}
                    ${selections[cat.id]?.waiver 
                        ? 'border-green-500 bg-green-900/20 text-green-200' 
                        : 'border-gray-600 text-gray-400 hover:border-gray-500'
                    }
                `}>
                  <input type="checkbox" checked={selections[cat.id]?.waiver || false}
                    onChange={e => updateSelection(cat.id, qty, e.target.checked)}
                    className="mr-3 accent-green-500 w-5 h-5 flex-shrink-0" />
                  <span>Waiver (+${cat.damage_waiver})</span>
                </label>
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
}