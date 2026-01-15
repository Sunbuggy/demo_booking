'use client';

export default function BookingProgress({ isStep1, isStep2, isStep3 }: any) {
  return (
    // SEMANTIC: Sticky Header Container
    // Replaced bg-gray-900 with bg-background
    // Replaced border-gray-800 with border-border
    <div className="sticky top-16 z-40 bg-background py-4 mb-8 shadow-sm border-b border-border transition-colors duration-300">
      <div className="flex items-center justify-center gap-4 md:gap-8">
        {[
          { label: 'Date & Time', active: isStep1 },
          { label: 'Vehicles', active: isStep2 },
          { label: 'Checkout', active: isStep3 }
        ].map((step, i) => (
          <div key={i} className="flex items-center">
            
            {/* Step Circle Indicator */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
              step.active 
                // SEMANTIC: Active = Primary Background + Contrast Text
                ? 'bg-primary text-primary-foreground shadow-md scale-110' 
                // SEMANTIC: Inactive = Muted Background + Muted Text
                : 'bg-muted text-muted-foreground'
            }`}>
              {/* Checkmark for completed intermediate steps, otherwise number */}
              {step.active && i < 2 ? '✓' : i + 1}
            </div>

            {/* Step Text Label */}
            <span className={`ml-2 hidden md:block font-medium transition-colors duration-300 ${
                step.active 
                // SEMANTIC: Active Text = Primary
                ? 'text-primary' 
                // SEMANTIC: Inactive Text = Muted Foreground
                : 'text-muted-foreground'
            }`}>
              {step.label}
            </span>

            {/* Connector Line (between steps) */}
            {i < 2 && (
                <div className={`w-12 h-1 mx-4 rounded-full transition-colors duration-300 ${
                    step.active 
                    // SEMANTIC: Active Line = Primary
                    ? 'bg-primary' 
                    // SEMANTIC: Inactive Line = Muted (or Border)
                    : 'bg-muted'
                }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}