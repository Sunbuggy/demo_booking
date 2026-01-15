'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getUserDetails } from '@/utils/supabase/queries';

// --- 1. Helper Component Moved OUTSIDE ---
// This prevents the "lose focus on type" bug.
const PeopleCard = ({ label, subLabel, value, min = 0, onUpdate }: any) => {
  
  // Local handler for typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Allow clearing the box completely while typing
    if (val === '') {
      onUpdate(''); 
      return;
    }

    // Only allow valid integers
    const numVal = parseInt(val);
    if (!isNaN(numVal) && numVal >= 0) {
      onUpdate(numVal);
    }
  };

  // Reset to min if left empty or invalid on blur
  const handleBlur = () => {
    if (value === '' || value === undefined || value === null || Number(value) < min) {
      onUpdate(min);
    }
  };

  const currentVal = Number(value) || 0;
  const isSelected = currentVal > min;

  return (
    // SEMANTIC: Card styling with conditional borders/rings
    <div 
      className={`
        transition-all duration-200 shadow-sm p-6 rounded-2xl flex flex-col h-full border
        ${isSelected 
          // SEMANTIC: Selected = Primary Border & Ring
          ? 'bg-card border-primary ring-2 ring-primary/20' 
          // SEMANTIC: Default = Standard Border
          : 'bg-card border-border hover:bg-muted/50'
        }
      `}
    >
      <div className="mb-4 text-center">
        {/* SEMANTIC: Text Colors */}
        <h4 className={`font-bold text-2xl mb-2 ${isSelected ? 'text-primary' : 'text-card-foreground'}`}>
          {label}
        </h4>
        <p className="text-muted-foreground text-xl">
          {subLabel}
        </p>
      </div>

      <div className="mt-auto">
        <div className={`flex items-center justify-between rounded p-1 transition-colors
            ${isSelected ? 'bg-primary/10' : 'bg-muted'} w-full
        `}>
           {/* SEMANTIC: Minus Button (Secondary/Ghost style) */}
           <button 
             type="button"
             onClick={() => onUpdate(Math.max(min, currentVal - 1))}
             disabled={currentVal <= min}
             className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-background text-foreground rounded font-bold hover:bg-background/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-input shadow-sm"
           >-</button>
           
           <input 
              type="number" 
              min={min}
              value={value === '' ? '' : currentVal} 
              onChange={handleInputChange}
              onBlur={handleBlur}
              // SEMANTIC: Input Text
              className="bg-transparent text-center font-bold focus:outline-none text-foreground appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full text-xl"
           />
           
           {/* SEMANTIC: Plus Button (Primary when selected) */}
           <button 
             type="button"
             onClick={() => onUpdate(currentVal + 1)}
             className={`w-10 h-10 flex items-center justify-center flex-shrink-0 rounded font-bold transition-colors shadow-sm
               ${isSelected 
                 ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                 : 'bg-background text-foreground hover:bg-background/80 border border-input'
               }`}
           >+</button>
        </div>
      </div>
    </div>
  );
};

// --- 2. Main Component ---
export default function ReservationHolderForm({ onUpdate, initialData }: any) {
  const [info, setInfo] = useState({ 
    firstName: initialData?.firstName || '', 
    lastName: initialData?.lastName || '', 
    email: initialData?.email || '', 
    phone: initialData?.phone || '',
    adults: initialData?.adults || 1, 
    minors: initialData?.minors || 0
  });
  
  const [staffName, setStaffName] = useState<string>('');
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    if (initialData) return;

    const fetchUser = async () => {
      const supabase = createClient();
      const detailsArray = await getUserDetails(supabase);

      if (detailsArray && detailsArray.length > 0) {
        const profile = detailsArray[0]; 
        const level = profile.user_level || 0;
        const isUserStaff = level > 100;
        setIsStaff(isUserStaff);

        if (isUserStaff) {
          const empName = profile.full_name || `${profile.first_name} ${profile.last_name}`;
          setStaffName(empName);
          onUpdate({ ...info, booked_by: empName });
        } else {
          const selfInfo = {
            ...info,
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            email: profile.email || '', 
            phone: profile.phone || ''
          };
          setInfo(selfInfo);
          onUpdate({ ...selfInfo, booked_by: 'Online' });
        }
      } else {
        onUpdate({ ...info, booked_by: 'Guest' });
      }
    };

    fetchUser();
  }, [initialData]); 

  const handleChange = (field: string, value: any) => {
    const newInfo = { ...info, [field]: value };
    setInfo(newInfo);
    
    const bookedBy = initialData?.booked_by || (isStaff ? staffName : (staffName ? 'Online' : 'Guest'));
    onUpdate({ ...newInfo, booked_by: bookedBy });
  };

  return (
    // SEMANTIC: Main Container (Card)
    <section className="bg-card text-card-foreground rounded-2xl p-6 md:p-8 mb-12 shadow-sm border border-border relative overflow-hidden">
      
      {/* Staff / Edit Banners */}
      {isStaff && !initialData && (
        // SEMANTIC: Primary tint for New Booking (Brand Action)
        <div className="bg-primary/10 border-b border-primary/20 p-4 -mx-6 -mt-6 md:-mx-8 md:-mt-8 mb-6 text-center">
            <p className="text-primary font-bold uppercase tracking-widest text-sm">
                New Booking By: <span className="text-foreground text-lg ml-2">{staffName}</span>
            </p>
        </div>
      )}
      {initialData && (
         // SEMANTIC: Secondary tint for Editing (Information Action)
         <div className="bg-secondary/50 border-b border-border p-4 -mx-6 -mt-6 md:-mx-8 md:-mt-8 mb-6 text-center">
            <p className="text-foreground font-bold uppercase tracking-widest text-sm">
                Editing Customer: <span className="text-primary text-lg ml-2">{initialData.firstName} {initialData.lastName}</span>
            </p>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-foreground text-center">Reservation Details</h2>

      {/* Contact Inputs */}
      <h3 className="text-lg font-bold text-muted-foreground mb-4 text-center uppercase tracking-wide">Primary Contact</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        <input 
            name="firstName" 
            placeholder="First Name *" 
            value={info.firstName} 
            onChange={(e) => handleChange('firstName', e.target.value)} 
            // SEMANTIC: Inputs use bg-background, border-input, and focus-ring
            className="p-4 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" 
        />
        <input 
            name="lastName" 
            placeholder="Last Name *" 
            value={info.lastName} 
            onChange={(e) => handleChange('lastName', e.target.value)} 
            className="p-4 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" 
        />
        <input 
            name="email" 
            type="email" 
            placeholder="Email *" 
            value={info.email} 
            onChange={(e) => handleChange('email', e.target.value)} 
            className="md:col-span-2 p-4 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" 
        />
        <input 
            name="phone" 
            type="tel" 
            placeholder="Phone *" 
            value={info.phone} 
            onChange={(e) => handleChange('phone', e.target.value)} 
            className="md:col-span-2 p-4 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" 
        />
      </div>

      <div className="border-t border-border my-8 mx-auto max-w-3xl"></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
        <PeopleCard 
          label="Adults" 
          subLabel="Age 18+" 
          value={info.adults} 
          min={1}
          onUpdate={(val: any) => handleChange('adults', val)} 
        />
        <PeopleCard 
          label="Minors" 
          subLabel="Under 18" 
          value={info.minors} 
          min={0}
          onUpdate={(val: any) => handleChange('minors', val)} 
        />
      </div>
    </section>
  );
}