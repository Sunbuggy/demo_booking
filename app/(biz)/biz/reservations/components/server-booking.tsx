'use client';
import { useEffect, useMemo, useState } from 'react';
import { CalendarFormEdit } from './booking-calendar';
import { mbj_vehicles_list, atv_vehicles_list, vof_vehicles_list, ffr_vehicles_list, ama_vehicles_list ,atv30_open_times, atv60_open_times } from '@/utils/helpers';
import { Reservation } from '@/app/(biz)/biz/types';
import { TabValue, VehicleCategory } from './booking-tabs';
import { createReservation, updateFullReservation } from '@/utils/old_db/actions';
import BookingPay from './booking-payment';

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

export type VehiclePricingType = {
  [key: string]: number | string | undefined;
  mb30?: number;
  mb60?: number;
  mb120?: number;
  full_atv?: number;
  desert_racer?: number;
  price?: number;
  name?: string;
};

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

export function BookingEditPage({
  hotels,
  initialData,
  viewMode = false
}: {
  hotels: HotelType[];
  initialData?: Reservation;
  viewMode?: boolean;
}) {
  const [selectedTabValue, setSelectedTabValue] = useState<TabValue>('mb60');
  const [selectedTimeValue, setSelectedTimeValue] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [freeShuttle, setFreeShuttle] = useState<boolean>(true);
  const [vehicleCounts, setVehicleCounts] = useState<VehicleCounts>({});
  const [totalSeats, setTotalSeats] = useState(0);
  const [totalPrice, setTotalPrice] = useState(
    initialData?.total_cost ? Number(initialData.total_cost) : 0
  );
  const [paymentIframeSrc, setPaymentIframeSrc] = useState<string>('');
  const [activeVehicleCategory, setActiveVehicleCategory] = useState<VehicleCategory>('Mini Baja');
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reservationId, setReservationId] = useState<number | null>(initialData?.res_id || null);

  const [contactForm, setContactForm] = useState<ContactFom>({
    name: '',
    email: '',
    phone: '',
    groupName: ''
  });

  const [bookInfo, setBookInfo] = useState<BookInfoType>(() => {
    const bookingDate = initialData?.sch_date ? new Date(initialData.sch_date) : new Date();
    const howManyPeople = initialData?.ppl_count || 1;
    
    console.log('Initializing bookInfo with:', {
      bookingDate,
      howManyPeople,
      initialDataSchDate: initialData?.sch_date
    });
    
    return {
      bookingDate,
      howManyPeople
    };
  });

  const hotelsMemo = useMemo(() => hotels, [hotels]);

  useEffect(() => {
    const total = Object.values(vehicleCounts).reduce(
      (acc, { count, seats }) => acc + count * seats,
      0
    );
    setTotalSeats(total);
  }, [vehicleCounts]);

  const getAllVehicles = () => {
    return [
      ...mbj_vehicles_list,
      ...atv_vehicles_list,
      ...vof_vehicles_list,
      ...ffr_vehicles_list,
      ...ama_vehicles_list
    ];
  };

  const convertToDisplayTime = (time24: string): string => {
    if (!time24) return '';

    if (time24.includes('am') || time24.includes('pm')) {
      return time24;
    }

    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;

    return `${displayHour} ${period}`;
  };

  const findMatchingTimeString = (time24: string, tabValue: TabValue): string => {
    if (!time24) return '';

    const displayTime = convertToDisplayTime(time24);

    const {
      mb30_open_times,
      mb60_open_times,
      mb120_open_times,
      vof_open_times,
      ffr_open_times,
      ama_open_times
    } = require('@/utils/helpers');

    let timeArray: string[] = [];

    switch (tabValue) {
      case 'mb30':
        timeArray = mb30_open_times;
        break;
      case 'mb60':
        timeArray = mb60_open_times;
        break;
      case 'mb120':
        timeArray = mb120_open_times;
        break;
      case 'atv30':
        timeArray = atv30_open_times;
        break;
      case 'atv60':
        timeArray = atv60_open_times;
        break;
      case 'Valley of Fire':
        timeArray = vof_open_times;
        break;
      case 'Family Fun Romp':
        timeArray = ffr_open_times;
        break;
      case 'Amargosa':
        timeArray = ama_open_times;
        break;
      default:
        timeArray = mb60_open_times;
    }

    const exactMatch = timeArray.find(time =>
      time.toLowerCase().includes(displayTime.toLowerCase())
    );

    if (exactMatch) return exactMatch;

    return displayTime;
  };

  const getVehicleFieldMapping = () => {
    return {
      'SB1': '1 seat desert racer',
      'SB2': '2 seat desert racer',
      'SB4': '4 seat desert racer',
      'SB6': '6 seat desert racer',
      'RWG': 'Ride with Guide',
      'QB': 'Full size ATV',
      'QA': 'Medium size ATV',
      'twoSeat4wd': '2 seat UTV',
    };
  };

  const getReverseFieldMapping = () => {
    const mapping: { [key: string]: string } = {};
    const fieldMapping = getVehicleFieldMapping();

    Object.entries(fieldMapping).forEach(([field, vehicleName]) => {
      mapping[vehicleName] = field;
    });

    return mapping;
  };

  const getVehicleCountByName = (vehicleName: string): number => {
    const vehicle = Object.values(vehicleCounts).find(
      v => v.name === vehicleName
    );
    return vehicle ? vehicle.count : 0;
  };

  // Generate payment iframe URL
  const generatePaymentIframe = async () => {
    if (!contactForm.name || !contactForm.phone || !contactForm.email || totalPrice <= 0) {
      alert('Please complete all contact information and ensure total price is calculated.');
      return;
    }

    if (!selectedTimeValue) {
      alert('Please select a time for your booking.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Split name into first and last name
      const nameParts = contactForm.name.trim().split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || 'Guest';

      let finalReservationId: number;
      let invoiceNumber: string;

      // Prepare reservation data
      const reservationData = {
        full_name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        occasion: contactForm.groupName || '',
        sch_date: bookInfo.bookingDate,
        sch_time: selectedTimeValue.split(' (')[0], // Remove discount info
        location: selectedTabValue === 'mb30' ? 'Nellis30' :
                 selectedTabValue === 'mb60' ? 'Nellis60' :
                 selectedTabValue === 'mb120' ? 'NellisDX' :
                 selectedTabValue === 'atv30' ? 'DunesATV30' :
                 selectedTabValue === 'atv60' ? 'DunesATV60' :
                 selectedTabValue === 'Valley of Fire' ? 'ValleyOfFire' :
                 selectedTabValue === 'Family Fun Romp' ? 'FamilyFun' :
                 'Amargosa',
        ppl_count: bookInfo.howManyPeople,
        hotel: freeShuttle ? selectedHotel : '',
        total_cost: totalPrice,
        // Add vehicle counts
        QA: getVehicleCountByName('Medium size ATV'),
        QB: getVehicleCountByName('Full size ATV'),
        SB1: getVehicleCountByName('1 seat desert racer'),
        SB2: getVehicleCountByName('2 seat desert racer'),
        SB4: getVehicleCountByName('4 seat desert racer'),
        SB6: getVehicleCountByName('6 seat desert racer'),
        twoSeat4wd: getVehicleCountByName('2 seat UTV'),
        RWG: getVehicleCountByName('Ride with Guide'),
      };

      if (initialData?.res_id) {
        // Update existing reservation
        const updateResult = await updateFullReservation(initialData.res_id, reservationData);
        
        if (updateResult.success) {
          finalReservationId = initialData.res_id;
          invoiceNumber = `${initialData.res_id}`;
          setReservationId(initialData.res_id);
        } else {
          throw new Error('Failed to update reservation: ' + updateResult.error);
        }
      } else {
        // Create new reservation
        const createResult = await createReservation(reservationData);
        
        if (createResult.success && createResult.reservationId) {
          finalReservationId = createResult.reservationId;
          invoiceNumber = `${createResult.reservationId}`;
          setReservationId(createResult.reservationId);
        } else {
          throw new Error('Failed to create reservation: ' + createResult.error);
        }
      }

      // Generate timestamp for cache busting
      const timestamp = Date.now();
      
      // Build the payment iframe URL - same as ChargesPismo
      const paymentUrl = `https://oceanoatvrentals.com/lib/oauthorizetestPP.php?invoiceNumber=${invoiceNumber}&cacke=${timestamp}&qost=${totalPrice}&fname=${encodeURIComponent(firstName)}&lname=${encodeURIComponent(lastName)}`;
      
      console.log('Payment URL generated:', paymentUrl);
      
      setPaymentIframeSrc(paymentUrl);
      setShowPayment(true);
      
    } catch (error) {
      console.error('Error generating payment:', error);
      alert('Error setting up payment. Please try again or contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      console.log('Initial data loaded:', initialData);

      const bookingDate = initialData.sch_date ? new Date(initialData.sch_date) : new Date();
      
      console.log('Setting booking date to:', bookingDate);
      console.log('Original sch_date from reservation:', initialData.sch_date);

      setTotalPrice(initialData.total_cost ? Number(initialData.total_cost) : 0);

      if (initialData.hotel) {
        if (initialData.hotel === 'Drive here') {
          setFreeShuttle(false);
          setSelectedHotel('');
        } else {
          setFreeShuttle(true);
          setSelectedHotel(initialData.hotel);
        }
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
      const allVehicles = getAllVehicles();
      const fieldMapping = getVehicleFieldMapping();
      const reverseMapping = getReverseFieldMapping();

      console.log('Mapping vehicle counts from reservation...');

      Object.entries(fieldMapping).forEach(([field, vehicleName]) => {
        const count = initialData[field as keyof Reservation];

        if (count !== undefined && count !== null && Number(count) > 0) {
          let vehicle;
          if (field === 'QB') {
            vehicle = allVehicles.find(v => v.name === 'Full ATV' || v.name === '1 Seat full ATV');
          } else {
            vehicle = allVehicles.find(v => v.name === vehicleName);
          }

          if (vehicle) {
            counts[vehicle.id] = {
              isChecked: true,
              count: Number(count),
              name: vehicle.name,
              seats: vehicle.seats,
              pricing: vehicle.pricing as VehiclePricingType
            };
            console.log(`Mapped ${field}: ${count} -> ${vehicle.name}`);
          }
        }
      });

      console.log('Final vehicle counts:', counts);
      setVehicleCounts(counts);

      const locationTabMap: Record<string, TabValue> = {
        'Nellis30': 'mb30',
        'Nellis60': 'mb60',
        'NellisDX': 'mb120',
        'DunesATV30': 'atv30',
        'DunesATV60': 'atv60',
        'ValleyOfFire': 'Valley of Fire',
        'FamilyFun': 'Family Fun Romp',
        'Amargosa': 'Amargosa',
      };

      const locationCategoryMap: Record<string, VehicleCategory> = {
        'Nellis30': 'Mini Baja',
        'Nellis60': 'Mini Baja',
        'NellisDX': 'Mini Baja',
        'DunesATV30': 'ATV',
        'DunesATV60': 'ATV',
        'ValleyOfFire': 'Valley of Fire',
        'FamilyFun': 'Family Fun',
        'Amargosa': 'Amargosa',
      };

      if (initialData.location) {
        const tabValue = locationTabMap[initialData.location] || 'mb60';
        const category = locationCategoryMap[initialData.location] || 'Mini Baja';
        console.log(`Setting tab to ${tabValue} and category to ${category} based on location ${initialData.location}`);

        setSelectedTabValue(tabValue);
        setActiveVehicleCategory(category);

        if (initialData.sch_time) {
          const matchingTime = findMatchingTimeString(initialData.sch_time, tabValue);
          console.log(`Setting time: ${initialData.sch_time} -> ${matchingTime}`);
          setSelectedTimeValue(matchingTime);
        } else {
          console.log('No time found in reservation');
        }
      }
    }
  }, [initialData]);

  return (
    <div className="font-extrabold dark:text-white sm:text-center flex flex-col justify-center items-center w-full">
      <div className="w-full max-w-4xl">
        <CalendarFormEdit
          bookInfo={bookInfo}
          freeShuttle={freeShuttle}
          hotelsMemo={hotelsMemo}
          isCalendarOpen={isCalendarOpen}
          open={open}
          selectedHotel={selectedHotel}
          setBookInfo={setBookInfo}
          setFreeShuttle={setFreeShuttle}
          setIsCalendarOpen={setIsCalendarOpen}
          setOpen={setOpen}
          setSelectedHotel={setSelectedHotel}
          setSelectedTimeValue={setSelectedTimeValue}
          setVehicleCounts={setVehicleCounts}
          vehicleCounts={vehicleCounts}
          totalSeats={totalSeats}
          setSelectedTabValue={setSelectedTabValue}
          selectedTabValue={selectedTabValue}
          selectedTimeValue={selectedTimeValue}
          total_cost={totalPrice}
          settotal_cost={setTotalPrice}
          contactForm={contactForm}
          setContactForm={setContactForm}
          viewMode={viewMode}
          initialData={initialData}
          activeVehicleCategory={activeVehicleCategory}
          setActiveVehicleCategory={setActiveVehicleCategory}
          onGeneratePayment={generatePaymentIframe}
          showPayment={showPayment}
          formToken={''}
        />

        {/* Payment Section */}
        <div id="payment-section" className="w-full mt-6">
          {/* Payment Button (shown when ready for payment) */}
          {!showPayment && !viewMode && totalPrice > 0 && selectedTimeValue && (
            <div className="mt-6 p-6 border rounded-lg shadow-lg bg-white">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Ready to Complete Your Booking</h3>
                <p className="text-gray-600 mb-2">
                  Total Amount: <span className="font-bold text-green-600">${totalPrice.toFixed(2)}</span>
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  Reservation will be created before payment
                </p>
                <button
                  type="button"
                  onClick={generatePaymentIframe}
                  disabled={isProcessing}
                  className="w-full max-w-md mx-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg shadow-md hover:shadow-lg"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Reservation...
                    </span>
                  ) : (
                    'Proceed to Secure Payment'
                  )}
                </button>
                <p className="mt-4 text-sm text-gray-500">
                  Secure payment processed by Authorize.net
                </p>
              </div>
            </div>
          )}

{showPayment && paymentIframeSrc && reservationId && (
  <div className="mt-6 p-4 border rounded-lg shadow-lg bg-white">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-gray-800">Complete Your Payment</h2>
      <button
        onClick={() => setShowPayment(false)}
        className="text-gray-500 hover:text-gray-700 text-2xl"
        title="Close payment"
      >
        ×
      </button>
    </div>
    
    <BookingPay 
      reservationId={reservationId}
      totalPrice={totalPrice}
      firstName={contactForm.name.split(' ')[0]}
      lastName={contactForm.name.split(' ').slice(1).join(' ') || 'Guest'}
    />
  </div>
)}
        </div>
      </div>
    </div>
  );
}