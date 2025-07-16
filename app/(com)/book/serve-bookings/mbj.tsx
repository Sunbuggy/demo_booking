'use client';
import { useEffect, useMemo, useState } from 'react';
import { CalendarForm } from '../booking-calendar/mbj';
import { createId } from '@paralleldrive/cuid2';
import { mbj_vehicles_list, minibajachase } from '@/utils/helpers';
import AdventureCard from '../../choose-adventure/cards';
import AcceptHostedPage from '../../payment/acceptHosted';
import { Reservation } from '@/app/(biz)/biz/types';
import Link from 'next/link';
// import { useRouter } from 'next/router';

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

// Making all properties of BaseVehiclePricingType optional
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

// Define the state object type, mapping vehicle IDs (assuming they are numbers) to their count objects
export interface VehicleCounts {
  [vehicleId: number]: VehicleCount;
}

export function MiniBajaPage({ 
  hotels, 
  initialData, 
  viewMode = false 
}: { 
  hotels: HotelType[];
  initialData?: Reservation;
  viewMode?: boolean;
}) {
    // const router = useRouter();
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
  const [totalPrice, setTotalPrice] = useState(0);
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

  useEffect(() => {
    const total = Object.values(vehicleCounts).reduce(
      (acc, { count, seats }) => acc + count * seats,
      0
    );
    setTotalSeats(total);
  }, [vehicleCounts]);

  useEffect(() => {
    if (selectedTimeValue !== null) {
      // Check if selectedTimeValue is not null or add your own condition
      handlePricing(selectedTimeValue);
    }
  }, [selectedTimeValue]);

  useEffect(() => {
    async function fetchData() {
      // e.preventDefault();
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

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const data = await response.json();
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (data.formToken) {
            setFormTokenError('');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
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
  }, [totalPrice]);

  useEffect(() => {
    if (response) console.log(response);
  }, [response]);

  const handlePricing = (selectedTimeValue: string) => {
    // Ensure selectedTimeValue is valid
    // Initialize total price
    let totalPrice = 0;

    // Iterate over each vehicle in vehicleCounts
    Object.values(vehicleCounts).forEach((vehicle) => {
      if (vehicle.isChecked) {
        // Fetch the price for the selected time value
        const priceForTime = vehicle.pricing[selectedTabValue];
        // Calculate total price for this vehicle
        const totalVehiclePrice = priceForTime * vehicle.count * vehicle.seats;
        // Add to the total price
        totalPrice += totalVehiclePrice;
      }
    });
    const hour = Number(selectedTimeValue.split(' ')[0]);
    const amPm = selectedTimeValue.split(' ')[1];
    // Create a 10% fuel fee
    const fuelFee = totalPrice * 0.1;
    // create a 6% fuel fee
    const serviceFee = totalPrice * 0.06;
    if (
      hour < 10 &&
      amPm === 'am' &&
      (selectedTabValue === 'mb60' || selectedTabValue === 'mb30')
    ) {
      // apply discount of 20%
      setTotalPrice(totalPrice * 0.8 + fuelFee + serviceFee);
    } else {
      setTotalPrice(totalPrice + serviceFee + fuelFee);
    }
  };


  useEffect(() => {
    if (initialData) {
      // Parse reservation date
      const bookingDate = initialData.sch_date ? new Date(initialData.sch_date) : new Date();
      
      // Set booking info
      setBookInfo({
        bookingDate,
        howManyPeople: initialData.ppl_count || 1
      });
      
      // Set contact info
      setContactForm({
        name: initialData.full_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        groupName: initialData.occasion || ''
      });
      
      // Map vehicle counts from reservation
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
      
      // Set location-based tab
      const locationTabMap: Record<string, 'mb30' | 'mb60' | 'mb120'> = {
        'Nellis30': 'mb30',
        'Nellis60': 'mb60',
        'Nellis': 'mb120'
      };
      
      if (initialData.location) {
        const tabValue = locationTabMap[initialData.location] || 'mb60';
        setSelectedTabValue(tabValue);
      }
      
      // Set time if available
      if (initialData.sch_time) {
        // Convert "HH:MM" to "H am/pm" format
        const [hours, minutes] = initialData.sch_time.split(':');
        const hour = parseInt(hours, 10);
        const period = hour >= 12 ? 'pm' : 'am';
        const displayHour = hour % 12 || 12;
        setSelectedTimeValue(`${displayHour} ${period}`);
      }
      
      // Automatically progress through form steps
      if (viewMode) {
        setHideForm(true);
        setShowContactForm(false);
        setShowPricing(true);
      }
    }
  }, [initialData, viewMode]);

  return (
    <div className=" font-extrabold dark:text-white sm:text-center flex flex-col justify-center items-center h-fit ">
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
        totalPrice={totalPrice}
        setTotalPrice={setTotalPrice}
        contactForm={contactForm}
        setContactForm={setContactForm}
        showContactForm={showContactForm}
        setShowContactForm={setShowContactForm}
        formToken={formToken}
        viewMode={viewMode}
        onEdit={viewMode ? () => <Link href={'/biz/reservations/${initialData?.res_id}'}></Link>: undefined}
      />
      {!viewMode && (
        <>
          {totalPrice && selectedTimeValue ? (
            <AcceptHostedPage formToken={formToken} setResponse={setResponse} />
          ) : (
            ''
          )}

          {formTokenError && selectedTimeValue && (
            <div>
              <p>
                {formTokenError
                  ? 'Some Problem Occured Please Pick a Different Time or Refresh This Page'
                  : ''}
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
