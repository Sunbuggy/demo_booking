'use client';
import { useEffect, useMemo, useState } from 'react';
import { CalendarForm } from './booking-calendar';
import { createId } from '@paralleldrive/cuid2';
import { mbj_vehicles_list, minibajachase } from '@/utils/helpers';
import AdventureCard from '@/app/(com)/choose-adventure/cards';
import AcceptHostedPage from '@/app/(com)/payment/acceptHosted';
import { Reservation } from '@/app/(biz)/biz/types';
import { useRouter } from 'next/navigation';

export interface HotelType {
  Hotel_ID: number;
  Hotel_Name: string;
  Hotel_Phone: string;
  Hotel_Address: string;
  Pickup_Location: string;
  Contact_Person: string;
}

export interface BookInfoType {
  bookingDate: Date;
  howManyPeople: number;
}

type BaseVehiclePricingType = {
  mb30: number;
  mb60: number;
  mb120: number;
};

export type VehiclePricingType = Partial<BaseVehiclePricingType>;
export interface VehicleCount {
  isChecked: boolean;
  count: number;
  name: string;
  seats: number;
  pricing: VehiclePricingType;
}

export interface ContactFom {
  name: string;
  email: string;
  phone: string;
  groupName?: string;
}

export interface VehicleCounts {
  [vehicleId: number]: VehicleCount;
}

export function MiniBajaPage({ 
  hotels, 
  initialData, 
  viewMode = false,
  editMode = false
}: { 
  hotels: HotelType[];
  initialData?: Reservation;
  viewMode?: boolean;
  editMode?: boolean;
}) {
  const router = useRouter();
  const decodedId = createId();
  const [selectedTabValue, setSelectedTabValue] = useState<
    'mb30' | 'mb60' | 'mb120'
  >('mb60');
  const [selectedTimeValue, setSelectedTimeValue] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [hideForm, setHideForm] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [freeShuttle, setFreeShuttle] = useState<boolean>(true);
  const [vehicleCounts, setVehicleCounts] = useState<VehicleCounts>({});
  const [totalSeats, setTotalSeats] = useState(0);
  const [showPricing, setShowPricing] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [totalPrice, setTotalPrice] = useState(
    initialData?.total_cost ? Number(initialData.total_cost) : 0
  );
  const [formToken, setFormToken] = useState('');
  const [formTokenError, setFormTokenError] = useState('');
  const [response, setResponse] = useState('');

  const [contactForm, setContactForm] = useState<ContactFom>({
    name: '',
    email: '',
    phone: '',
    groupName: ''
  });
  const [bookInfo, setBookInfo] = useState({
    bookingDate: new Date(),
    howManyPeople: 1
  });
  const hotelsMemo = useMemo(() => hotels, [hotels]);

  // Handle cancel edit
  const handleCancelEdit = () => {
    router.push(`/biz/reservations/${initialData?.res_id}`);
  };

  useEffect(() => {
    const total = Object.values(vehicleCounts).reduce(
      (acc, { count, seats }) => acc + count * seats,
      0
    );
    setTotalSeats(total);
  }, [vehicleCounts]);

  useEffect(() => {
    if (selectedTimeValue !== null) {
      handlePricing(selectedTimeValue);
    }
  }, [selectedTimeValue]);

  useEffect(() => {
    // Automatically progress through form steps in edit mode
    if (editMode) {
      setHideForm(true);
      setShowContactForm(true);
      setShowPricing(true);
    }
  }, [editMode]);

  useEffect(() => {
    async function fetchData() {
      const decodedIdreduced = decodedId.slice(0, 16);
      const fname = contactForm.name.split(' ')[0];
      const lname = contactForm.name.split(' ')[1] || 'no last name';
      const phone = contactForm.phone;

      try {
        if (totalPrice && decodedId) {
          const last_page = 'book/mini-baja-chase';
          const response = await fetch(
            `/api/authorize-net/acceptHosted/?amt=${String(totalPrice.toFixed(2))}&invoiceNumber=${decodedIdreduced}&fname=${fname}&lname=${lname}&phone=${phone}&lastpage=${last_page}`
          );

          const data = await response.json();
          if (data.formToken) {
            setFormTokenError('');
            setFormToken(data.formToken);
          } else {
            setFormTokenError(`Error fetching form token`);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    void fetchData();
  }, [totalPrice, decodedId, contactForm]);

  useEffect(() => {
    if (response) console.log(response);
  }, [response]);

  const handlePricing = (selectedTimeValue: string) => {
    if (viewMode) return; 
    
    let totalPrice = 0;
    Object.values(vehicleCounts).forEach((vehicle) => {
      if (vehicle.isChecked) {
        const priceForTime = vehicle.pricing[selectedTabValue];
        const totalVehiclePrice = priceForTime * vehicle.count * vehicle.seats;
        totalPrice += totalVehiclePrice;
      }
    });
    
    const hour = Number(selectedTimeValue.split(' ')[0]);
    const amPm = selectedTimeValue.split(' ')[1];
    const fuelFee = totalPrice * 0.1;
    const serviceFee = totalPrice * 0.06;
    
    if (
      hour < 10 &&
      amPm === 'am' &&
      (selectedTabValue === 'mb60' || selectedTabValue === 'mb30')
    ) {
      setTotalPrice(totalPrice * 0.8 + fuelFee + serviceFee);
    } else {
      setTotalPrice(totalPrice + serviceFee + fuelFee);
    }
  };

  useEffect(() => {
    if (initialData) {
      const bookingDate = initialData.sch_date ? new Date(initialData.sch_date) : new Date();
      
      setTotalPrice(initialData.total_cost ? Number(initialData.total_cost) : 0);

      if (initialData.hotel === 'Drive here') {
        setFreeShuttle(false);
        setSelectedHotel('');
      } else if (initialData.hotel) {
        setFreeShuttle(true);
        setSelectedHotel(initialData.hotel);
      } else {
        setFreeShuttle(false);
        setSelectedHotel('');
      }

      setBookInfo({
        bookingDate,
        howManyPeople: initialData.ppl_count || 1
      });
      
      setContactForm({
        name: initialData.full_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        groupName: initialData.occasion || ''
      });
      
      const counts: VehicleCounts = {};
      mbj_vehicles_list.forEach(vehicle => {
        const key = vehicle.name.split(' ')[0].toLowerCase().replace('-', '');
        const count = initialData[key as keyof Reservation];
        if (count && Number(count) > 0) {
          counts[vehicle.id] = {
            isChecked: true,
            count: Number(count),
            name: vehicle.name,
            seats: vehicle.seats,
            pricing: vehicle.pricing
          };
        }
      });
      setVehicleCounts(counts);
      
      const locationTabMap: Record<string, 'mb30' | 'mb60' | 'mb120'> = {
        'Nellis30': 'mb30',
        'Nellis60': 'mb60',
        'NellisDX': 'mb120'
      };
      
      if (initialData.location) {
        const tabValue = locationTabMap[initialData.location] || 'mb60';
        setSelectedTabValue(tabValue);
      }
      
      if (initialData.sch_time) {
        const [hours, minutes] = initialData.sch_time.split(':');
        const hour = parseInt(hours, 10);
        const period = hour >= 12 ? 'pm' : 'am';
        const displayHour = hour % 12 || 12;
        setSelectedTimeValue(`${displayHour} ${period}`);
      }
      
      if (viewMode) {
        setHideForm(true);
        setShowContactForm(false);
        setShowPricing(true);
      }
    }
  }, [initialData, viewMode]);

  return (
    <div className="font-extrabold dark:text-white sm:text-center flex flex-col justify-center items-center h-fit">
      <CalendarForm
        bookInfo={bookInfo}
        freeShuttle={freeShuttle}
        hideForm={hideForm}
        hotelsMemo={hotelsMemo}
        isCalendarOpen={isCalendarOpen}
        open={open}
        selectedHotel={selectedHotel}
        setBookInfo={setBookInfo}
        setFreeShuttle={setFreeShuttle}
        setHideForm={setHideForm}
        setIsCalendarOpen={setIsCalendarOpen}
        setOpen={setOpen}
        setSelectedHotel={setSelectedHotel}
        setSelectedTimeValue={setSelectedTimeValue}
        setVehicleCounts={setVehicleCounts}
        vehicleCounts={vehicleCounts}
        totalSeats={totalSeats}
        showPricing={showPricing}
        setShowPricing={setShowPricing}
        setSelectedTabValue={setSelectedTabValue}
        selectedTabValue={selectedTabValue}
        selectedTimeValue={selectedTimeValue}
        total_cost={totalPrice}
        settotal_cost={setTotalPrice}
        contactForm={contactForm}
        setContactForm={setContactForm}
        showContactForm={showContactForm}
        setShowContactForm={setShowContactForm}
        formToken={formToken}
        viewMode={viewMode}
        editMode={editMode}
        onCancelEdit={handleCancelEdit}
      />
      
      {!viewMode && !editMode && (
        <>
          {totalPrice && selectedTimeValue && (
            <AcceptHostedPage formToken={formToken} setResponse={setResponse} />
          )}
          
          {formTokenError && selectedTimeValue && (
            <div>
              <p>
                {formTokenError || 
                  'Some Problem Occured Please Pick a Different Time or Refresh This Page'}
              </p>
            </div>
          )}
          
          <AdventureCard
            description={minibajachase.description}
            title={minibajachase.title}
            videoId={minibajachase.videoId}
            playlistId={minibajachase.playlistId}
            linkHref="/book/minibaja-chase"
            showBookButton={false}
          />
        </>
      )}
    </div>
  );
}