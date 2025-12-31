'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getUserDetails } from '@/utils/supabase/queries';

export default function ReservationHolderForm({ onUpdate }: any) {
  const [info, setInfo] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [staffName, setStaffName] = useState<string>('');
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
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

          onUpdate({ 
            firstName: '', 
            lastName: '', 
            email: '', 
            phone: '', 
            booked_by: empName 
          });
        } else {
          const selfInfo = {
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            email: profile.email || '', 
            phone: profile.phone || ''
          };

          setInfo(selfInfo);
          onUpdate({ 
            ...selfInfo, 
            booked_by: 'Online' 
          });
        }
      } else {
        onUpdate({ 
          firstName: '', 
          lastName: '', 
          email: '', 
          phone: '', 
          booked_by: 'Guest' 
        });
      }
    };

    fetchUser();
  }, []); 

  const handleChange = (e: any) => {
    const newInfo = { ...info, [e.target.name]: e.target.value };
    setInfo(newInfo);
    
    onUpdate({ 
        ...newInfo, 
        booked_by: isStaff ? staffName : (staffName ? 'Online' : 'Guest') 
    });
  };

  return (
    <section className="bg-gray-800 rounded-2xl p-6 md:p-8 mb-12 shadow-xl border border-gray-700 relative overflow-hidden">
      
      {isStaff && (
        <div className="bg-orange-600/20 border-b border-orange-600/30 p-4 -mx-6 -mt-6 md:-mx-8 md:-mt-8 mb-6 text-center">
            <p className="text-orange-400 font-bold uppercase tracking-widest text-sm">
                New Booking By: <span className="text-white text-lg ml-2">{staffName}</span>
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