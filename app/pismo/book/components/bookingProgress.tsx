export default function BookingProgress({ isStep1, isStep2, isStep3 }: any) {
  return (
    <div className="sticky top-16 z-40 bg-gray-900 py-4 mb-8 shadow-md border-b border-gray-800">
      <div className="flex items-center justify-center gap-4 md:gap-8">
        {[
          { label: 'Date & Time', active: isStep1 },
          { label: 'Vehicles', active: isStep2 },
          { label: 'Checkout', active: isStep3 }
        ].map((step, i) => (
          <div key={i} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
              step.active ? 'bg-orange-600' : 'bg-gray-700 text-gray-400'
            }`}>
              {step.active && i < 2 ? '✓' : i + 1}
            </div>
            <span className={`ml-2 hidden md:block ${step.active ? 'text-orange-400' : 'text-gray-500'}`}>
              {step.label}
            </span>
            {i < 2 && <div className={`w-12 h-1 mx-4 ${step.active ? 'bg-orange-600' : 'bg-gray-700'}`} />}
          </div>
        ))}
      </div>
    </div>
  );
}