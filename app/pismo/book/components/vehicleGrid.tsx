'use client';

export default function VehicleGrid({ categories, selections, setSelections, durationHours }: any) {
  
  const updateSelection = (id: string, qty: number, waiver: boolean) => {
    setSelections((prev: any) => ({ ...prev, [id]: { qty, waiver } }));
  };

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-center mb-10">4. Select Vehicles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat: any) => {
          const qty = selections[cat.id]?.qty || 0;
          const isSelected = qty > 0;

          return (
            <div 
              key={cat.id} 
              className={`p-6 rounded-2xl shadow-xl flex flex-col transition-all duration-200 
                ${isSelected 
                  ? 'bg-gray-800 border-2 border-orange-500 ring-4 ring-orange-500/20' 
                  : 'bg-gray-800 border border-transparent'
                }`}
            >
              <h4 className={`text-2xl font-bold mb-2 text-center ${isSelected ? 'text-orange-400' : 'text-white'}`}>
                {cat.vehicle_name}
              </h4>
              <p className="text-xl text-center mb-4 text-gray-400">
                ${cat[`price_${durationHours}hr`] || cat.price_1hr} / {durationHours}hr
              </p>
              
              <div className="mt-auto space-y-4">
                {/* Quantity Controls */}
                <div className={`flex items-center rounded p-1 ${isSelected ? 'bg-orange-900/30' : 'bg-gray-700'}`}>
                   <button 
                     onClick={() => updateSelection(cat.id, Math.max(0, qty - 1), selections[cat.id]?.waiver)}
                     className="px-4 py-2 bg-gray-600 rounded text-white font-bold hover:bg-gray-500 transition-colors"
                   >-</button>
                   
                   <input 
                      type="number" 
                      min="0" 
                      value={qty} 
                      onChange={e => updateSelection(cat.id, parseInt(e.target.value) || 0, selections[cat.id]?.waiver)}
                      className="flex-1 bg-transparent text-center font-bold text-xl focus:outline-none text-white" 
                   />
                   
                   <button 
                     onClick={() => updateSelection(cat.id, qty + 1, selections[cat.id]?.waiver)}
                     className={`px-4 py-2 rounded text-white font-bold transition-colors ${isSelected ? 'bg-orange-600 hover:bg-orange-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                   >+</button>
                </div>
                
                {/* Waiver Checkbox */}
                <label className={`flex items-center text-sm p-3 rounded cursor-pointer border transition-colors ${
                    selections[cat.id]?.waiver 
                    ? 'border-green-500 bg-green-900/20 text-green-200' 
                    : 'border-gray-600 text-gray-400 hover:border-gray-500'
                }`}>
                  <input type="checkbox" checked={selections[cat.id]?.waiver || false}
                    onChange={e => updateSelection(cat.id, qty, e.target.checked)}
                    className="mr-3 accent-green-500 w-5 h-5" />
                  Add Damage Waiver (${cat.damage_waiver}/unit)
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}