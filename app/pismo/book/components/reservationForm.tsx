import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function ReservationHolderForm({ onUpdate }: any) {
  const [bookingForSelf, setBookingForSelf] = useState(true);
  const [info, setInfo] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name, phone, user_level').eq('id', user.id).single();
        setIsStaff((profile?.user_level || 0) >= 300);
        const parts = profile?.full_name?.split(' ') || [];
        const newInfo = { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '', email: user.email || '', phone: profile?.phone || '' };
        setInfo(newInfo);
        onUpdate(newInfo);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e: any) => {
    const newInfo = { ...info, [e.target.name]: e.target.value };
    setInfo(newInfo);
    onUpdate(newInfo);
  };

  return (
    <section className="bg-gray-800 rounded-2xl p-6 md:p-8 mb-12 shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-orange-500 text-center">Reservation Holder</h2>
      {isStaff && (
        <div className="mb-8 flex justify-center">
            <button type="button" onClick={() => setBookingForSelf(!bookingForSelf)} className="relative h-12 rounded-full w-80 bg-gray-700 px-3">
               <span className={`absolute left-5 ${bookingForSelf ? 'text-white' : 'text-gray-500'}`}>Me</span>
               <span className={`absolute right-5 ${!bookingForSelf ? 'text-white' : 'text-gray-500'}`}>Someone Else</span>
               <div className={`w-36 h-10 rounded-full bg-orange-600 transition-transform ${bookingForSelf ? 'translate-x-0' : 'translate-x-36'}`} />
            </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        <input name="firstName" placeholder="First Name *" value={info.firstName} onChange={handleChange} className="p-4 bg-gray-700 rounded-lg" />
        <input name="lastName" placeholder="Last Name *" value={info.lastName} onChange={handleChange} className="p-4 bg-gray-700 rounded-lg" />
        <input name="email" type="email" placeholder="Email *" value={info.email} onChange={handleChange} className="md:col-span-2 p-4 bg-gray-700 rounded-lg" />
        <input name="phone" type="tel" placeholder="Phone *" value={info.phone} onChange={handleChange} className="md:col-span-2 p-4 bg-gray-700 rounded-lg" />
      </div>
    </section>
  );
}