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
    <div 
      className={`
        transition-all duration-200 shadow-xl p-6 rounded-2xl flex flex-col h-full
        ${isSelected 
          ? 'bg-gray-800 border-2 border-orange-500 ring-4 ring-orange-500/20' 
          : 'bg-gray-800 border border-transparent hover:bg-gray-750'
        }
      `}
    >
      <div className="mb-4 text-center">
        <h4 className={`font-bold text-2xl mb-2 ${isSelected ? 'text-orange-400' : 'text-white'}`}>
          {label}
        </h4>
        <p className="text-gray-400 text-xl">
          {subLabel}
        </p>
      </div>

      <div className="mt-auto">
        <div className={`flex items-center justify-between rounded p-1 
            ${isSelected ? 'bg-orange-900/30' : 'bg-gray-700'} w-full
        `}>
           <button 
             type="button"
             onClick={() => onUpdate(Math.max(min, currentVal - 1))}
             disabled={currentVal <= min}
             className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-gray-600 rounded text-white font-bold hover:bg-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
           >-</button>
           
           <input 
              type="number" 
              min={min}
              // Handle empty string explicitly for controlled input
              value={value === '' ? '' : currentVal} 
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="bg-transparent text-center font-bold focus:outline-none text-white appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full text-xl"
           />
           
           <button 
             type="button"
             onClick={() => onUpdate(currentVal + 1)}
             className={`w-10 h-10 flex items-center justify-center flex-shrink-0 rounded text-white font-bold transition-colors ${isSelected ? 'bg-orange-600 hover:bg-orange-500' : 'bg-gray-600 hover:bg-gray-500'}`}
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
    <section className="bg-gray-800 rounded-2xl p-6 md:p-8 mb-12 shadow-xl border border-gray-700 relative overflow-hidden">
      
      {/* Staff / Edit Banners */}
      {isStaff && !initialData && (
        <div className="bg-orange-600/20 border-b border-orange-600/30 p-4 -mx-6 -mt-6 md:-mx-8 md:-mt-8 mb-6 text-center">
            <p className="text-orange-400 font-bold uppercase tracking-widest text-sm">
                New Booking By: <span className="text-white text-lg ml-2">{staffName}</span>
            </p>
        </div>
      )}
      {initialData && (
         <div className="bg-blue-600/20 border-b border-blue-600/30 p-4 -mx-6 -mt-6 md:-mx-8 md:-mt-8 mb-6 text-center">
            <p className="text-blue-400 font-bold uppercase tracking-widest text-sm">
                Editing Customer: <span className="text-white text-lg ml-2">{initialData.firstName} {initialData.lastName}</span>
            </p>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-white text-center">Reservation Details</h2>

      {/* Contact Inputs */}
      <h3 className="text-lg font-bold text-gray-400 mb-4 text-center uppercase tracking-wide">Primary Contact</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        <input name="firstName" placeholder="First Name *" value={info.firstName} onChange={(e) => handleChange('firstName', e.target.value)} className="p-4 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" />
        <input name="lastName" placeholder="Last Name *" value={info.lastName} onChange={(e) => handleChange('lastName', e.target.value)} className="p-4 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" />
        <input name="email" type="email" placeholder="Email *" value={info.email} onChange={(e) => handleChange('email', e.target.value)} className="md:col-span-2 p-4 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" />
        <input name="phone" type="tel" placeholder="Phone *" value={info.phone} onChange={(e) => handleChange('phone', e.target.value)} className="md:col-span-2 p-4 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" />
      </div>

      <div className="border-t border-gray-700 my-8 mx-auto max-w-3xl"></div>

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