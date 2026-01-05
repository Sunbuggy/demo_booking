'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getUserDetails } from '@/utils/supabase/queries';

export default function ReservationHolderForm({ onUpdate, initialData }: any) {
  // Use initialData if provided (Edit Mode), otherwise default empty (New Booking)
  const [info, setInfo] = useState({ 
    firstName: initialData?.firstName || '', 
    lastName: initialData?.lastName || '', 
    email: initialData?.email || '', 
    phone: initialData?.phone || '' 
  });
  
  const [staffName, setStaffName] = useState<string>('');
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    // If editing, skip fetching user details (we want the customer's info, not the staff's)
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
          onUpdate({ firstName: '', lastName: '', email: '', phone: '', booked_by: empName });
        } else {
          const selfInfo = {
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            email: profile.email || '', 
            phone: profile.phone || ''
          };
          setInfo(selfInfo);
          onUpdate({ ...selfInfo, booked_by: 'Online' });
        }
      } else {
        onUpdate({ firstName: '', lastName: '', email: '', phone: '', booked_by: 'Guest' });
      }
    };

    fetchUser();
  }, [initialData]); // Run only on mount or if initialData changes

  const handleChange = (e: any) => {
    const newInfo = { ...info, [e.target.name]: e.target.value };
    setInfo(newInfo);
    
    // Determine booked_by logic:
    // 1. If editing, keep original. 2. If new & staff, use staff name. 3. Else Online/Guest.
    const bookedBy = initialData?.booked_by || (isStaff ? staffName : (staffName ? 'Online' : 'Guest'));

    onUpdate({ ...newInfo, booked_by: bookedBy });
  };

  return (
    <section className="bg-gray-800 rounded-2xl p-6 md:p-8 mb-12 shadow-xl border border-gray-700 relative overflow-hidden">
      
      {/* Banner for New Bookings by Staff */}
      {isStaff && !initialData && (
        <div className="bg-orange-600/20 border-b border-orange-600/30 p-4 -mx-6 -mt-6 md:-mx-8 md:-mt-8 mb-6 text-center">
            <p className="text-orange-400 font-bold uppercase tracking-widest text-sm">
                New Booking By: <span className="text-white text-lg ml-2">{staffName}</span>
            </p>
        </div>
      )}

      {/* Banner for Editing Existing Reservation */}
      {initialData && (
         <div className="bg-blue-600/20 border-b border-blue-600/30 p-4 -mx-6 -mt-6 md:-mx-8 md:-mt-8 mb-6 text-center">
            <p className="text-blue-400 font-bold uppercase tracking-widest text-sm">
                Editing Customer: <span className="text-white text-lg ml-2">{initialData.firstName} {initialData.lastName}</span>
            </p>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-white text-center">Reservation Holder</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        <input name="firstName" placeholder="First Name *" value={info.firstName} onChange={handleChange} className="p-4 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" />
        <input name="lastName" placeholder="Last Name *" value={info.lastName} onChange={handleChange} className="p-4 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" />
        <input name="email" type="email" placeholder="Email *" value={info.email} onChange={handleChange} className="md:col-span-2 p-4 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" />
        <input name="phone" type="tel" placeholder="Phone *" value={info.phone} onChange={handleChange} className="md:col-span-2 p-4 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all" />
      </div>
    </section>
  );
}