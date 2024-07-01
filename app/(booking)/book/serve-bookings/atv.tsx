'use client';
import { useEffect, useMemo, useState } from 'react';
import { CalendarForm } from '../booking-calendar/atv';
import { createId } from '@paralleldrive/cuid2';

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
  full_atv: number;
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

export function ATVPage({ hotels }: { hotels: HotelType[] }) {
  const decodedId = createId();

  const [selectedTabValue, setSelectedTabValue] =
    useState<'Premium ATV Tours'>('Premium ATV Tours');
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
      console.log(selectedTimeValue);
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
          const last_page = 'book/familyfunromp';
          const response = await fetch(
            `/api/authorize-net/acceptHosted/?amt=${String(totalPrice.toFixed(2))}&invoiceNumber=${decodedIdreduced}&fname=${fname}&lname=${lname}&phone=${phone}&lastpage=${last_page}`
          );

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const data = await response.json();
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (data.formToken) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            setFormToken(data.formToken);
          } else {
            setFormTokenError(`Error fetching form token`);
          }
        }
      } catch (error) {
        console.log(error);
      }
    }

    void fetchData();
  }, [totalPrice]);
  const handlePricing = (selectedTimeValue: string) => {
    // Ensure selectedTimeValue is valid
    // Initialize total price
    let totalPrice = 0;

    // Iterate over each vehicle in vehicleCounts
    Object.values(vehicleCounts).forEach((vehicle) => {
      if (vehicle.isChecked) {
        // Fetch the price for the selected time value
        const priceForTime = vehicle.pricing['full_atv'];
        console.log(vehicle);
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
      selectedTabValue === 'Premium ATV Tours'
    ) {
      // apply discount of 20%
      setTotalPrice(totalPrice * 0.8 + fuelFee + serviceFee);
      // setTotalPrice(totalPrice + fuelFee + serviceFee);
    } else {
      setTotalPrice(totalPrice + serviceFee + fuelFee);
    }
  };

  return (
    <div className=" font-extrabold dark:text-white sm:text-center grid justify-center items-start h-fit ">
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
      />
      {formTokenError && (
        <div>
          <p>{formTokenError}</p>
        </div>
      )}
    </div>
  );
}
