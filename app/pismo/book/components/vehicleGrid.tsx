export default function VehicleGrid({ categories, selections, setSelections, durationHours }: any) {
  const updateSelection = (id: string, qty: number, waiver: boolean) => {
    setSelections((prev: any) => ({ ...prev, [id]: { qty, waiver } }));
  };

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-center mb-10">4. Select Vehicles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat: any) => (
          <div key={cat.id} className="bg-gray-800 p-6 rounded-2xl shadow-xl flex flex-col">
            <h4 className="text-2xl font-bold mb-2 text-center">{cat.vehicle_name}</h4>
            <p className="text-xl text-center mb-4 text-gray-400">
              ${cat[`price_${durationHours}hr`] || cat.price_1hr} / {durationHours}hr
            </p>
            <div className="mt-auto space-y-4">
              <input type="number" min="0" value={selections[cat.id]?.qty || 0} 
                onChange={e => updateSelection(cat.id, parseInt(e.target.value) || 0, selections[cat.id]?.waiver)}
                className="p-3 bg-gray-700 rounded w-full" />
              <label className="flex items-center text-sm">
                <input type="checkbox" checked={selections[cat.id]?.waiver || false}
                  onChange={e => updateSelection(cat.id, selections[cat.id]?.qty, e.target.checked)}
                  className="mr-2" />
                Add Damage Waiver (${cat.damage_waiver}/unit)
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}