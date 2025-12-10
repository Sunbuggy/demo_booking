'use client';
import { useEffect, useMemo, useState } from 'react';
import { CalendarFormEdit } from './booking-calendar';
import { mbj_vehicles_list, atv_vehicles_list, vof_vehicles_list, ffr_vehicles_list, ama_vehicles_list ,atv30_open_times, atv60_open_times } from '@/utils/helpers';
import { Reservation } from '@/app/(biz)/biz/types';
import { TabValue, VehicleCategory } from './booking-tabs';
import BookingPay from './booking-payment';
import { createReservation, updateFullReservation } from '@/utils/old_db/actions';

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
  const [formToken, setFormToken] = useState('');
  const [activeVehicleCategory, setActiveVehicleCategory] = useState<VehicleCategory>('Mini Baja');
  const [paymentResponse, setPaymentResponse] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

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

  // Generate form token using the real API
// const generateFormToken = async () => {
//   if (!contactForm.name || !contactForm.phone || !contactForm.email || totalPrice <= 0) {
//     alert('Please complete all contact information and ensure total price is calculated.');
//     return;
//   }

//   if (!selectedTimeValue) {
//     alert('Please select a time for your booking.');
//     return;
//   }

//   setIsGeneratingToken(true);
//   try {
//     // Check if we're editing an existing reservation or creating a new one
//     let invoiceNumber: string;
//     let finalReservationId: number | null = null;

//     if (initialData?.res_id) {
//       // For existing reservation - update it first
//       console.log('Updating existing reservation:', initialData.res_id);
      
//       // Prepare reservation data for update
//       const reservationData = {
//         full_name: contactForm.name,
//         email: contactForm.email,
//         phone: contactForm.phone,
//         occasion: contactForm.groupName || '',
//         sch_date: bookInfo.bookingDate.toISOString().split('T')[0],
//         sch_time: selectedTimeValue.split(' (')[0], // Remove discount info
//         location: selectedTabValue === 'mb30' ? 'Nellis30' :
//                  selectedTabValue === 'mb60' ? 'Nellis60' :
//                  selectedTabValue === 'mb120' ? 'NellisDX' :
//                  selectedTabValue === 'atv30' ? 'DunesATV30' :
//                  selectedTabValue === 'atv60' ? 'DunesATV60' :
//                  selectedTabValue === 'Valley of Fire' ? 'ValleyOfFire' :
//                  selectedTabValue === 'Family Fun Romp' ? 'FamilyFun' :
//                  'Amargosa',
//         ppl_count: bookInfo.howManyPeople,
//         hotel: freeShuttle ? selectedHotel : '',
//         total_cost: totalPrice,
//         // Add vehicle counts
//         QA: getVehicleCountByName('Medium size ATV'),
//         QB: getVehicleCountByName('Full size ATV'),
//         SB1: getVehicleCountByName('1 seat desert racer'),
//         SB2: getVehicleCountByName('2 seat desert racer'),
//         SB4: getVehicleCountByName('4 seat desert racer'),
//         SB6: getVehicleCountByName('6 seat desert racer'),
//         twoSeat4wd: getVehicleCountByName('2 seat UTV'),
//         RWG: getVehicleCountByName('Ride with Guide'),
//       };

//       // Update the reservation
//       const updateResult = await updateFullReservation(initialData.res_id, reservationData);
      
//       if (updateResult.success) {
//         invoiceNumber = `${initialData.res_id}`;
//         finalReservationId = initialData.res_id;
//         console.log('Reservation updated successfully:', initialData.res_id);
//       } else {
//         throw new Error('Failed to update reservation: ' + updateResult.error);
//       }
//     } else {
//       // For new reservation - create it first
//       console.log('Creating new reservation');
      
//       // Prepare reservation data for creation
//       const reservationData = {
//         full_name: contactForm.name,
//         email: contactForm.email,
//         phone: contactForm.phone,
//         occasion: contactForm.groupName || '',
//         sch_date: bookInfo.bookingDate.toISOString().split('T')[0],
//         sch_time: selectedTimeValue.split(' (')[0], // Remove discount info
//         location: selectedTabValue === 'mb30' ? 'Nellis30' :
//                  selectedTabValue === 'mb60' ? 'Nellis60' :
//                  selectedTabValue === 'mb120' ? 'NellisDX' :
//                  selectedTabValue === 'atv30' ? 'DunesATV30' :
//                  selectedTabValue === 'atv60' ? 'DunesATV60' :
//                  selectedTabValue === 'Valley of Fire' ? 'ValleyOfFire' :
//                  selectedTabValue === 'Family Fun Romp' ? 'FamilyFun' :
//                  'Amargosa',
//         ppl_count: bookInfo.howManyPeople,
//         hotel: freeShuttle ? selectedHotel : '',
//         total_cost: totalPrice,
//         // Add vehicle counts
//         QA: getVehicleCountByName('Medium size ATV'),
//         QB: getVehicleCountByName('Full size ATV'),
//         SB1: getVehicleCountByName('1 seat desert racer'),
//         SB2: getVehicleCountByName('2 seat desert racer'),
//         SB4: getVehicleCountByName('4 seat desert racer'),
//         SB6: getVehicleCountByName('6 seat desert racer'),
//         twoSeat4wd: getVehicleCountByName('2 seat UTV'),
//         RWG: getVehicleCountByName('Ride with Guide'),
//       };

//       // Create the reservation
//       const createResult = await createReservation(reservationData);
      
//       if (createResult.success && createResult.reservationId) {
//         invoiceNumber = `${createResult.reservationId}`;
//         finalReservationId = createResult.reservationId;
//         console.log('Reservation created successfully:', createResult.reservationId);
//       } else {
//         throw new Error('Failed to create reservation: ' + createResult.error);
//       }
//     }

//     // Split name into first and last name
//     const nameParts = contactForm.name.trim().split(' ');
//     const firstName = nameParts[0] || 'Customer';
//     const lastName = nameParts.slice(1).join(' ') || 'Guest';

//     console.log('Generating payment token with:', {
//       amount: totalPrice,
//       invoiceNumber,
//       firstName,
//       lastName,
//       phone: contactForm.phone,
//       reservationId: finalReservationId
//     });

//     // Call API endpoint to generate payment token
//     const response = await fetch(
//       `/api/authorize-net/acceptHosted/?amt=${totalPrice}&invoiceNumber=${encodeURIComponent(invoiceNumber)}&fname=${encodeURIComponent(firstName)}&lname=${encodeURIComponent(lastName)}&phone=${encodeURIComponent(contactForm.phone)}&lastpage=booking`
//     );

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('API response error:', response.status, errorText);
//       throw new Error(`API call failed: ${response.status} - ${errorText}`);
//     }

//     const data = await response.json();
    
//     if (data.formToken) {
//       setFormToken(data.formToken);
//       setShowPayment(true);
//       console.log('Form token generated successfully');
//     } else {
//       console.error('No form token in response:', data);
//       throw new Error('No form token received from API');
//     }
//   } catch (error) {
//     console.error('Error generating form token:', error);
//     alert('Error initializing payment. Please try again or contact support.');
//   } finally {
//     setIsGeneratingToken(false);
//   }
// };

// // Add this helper function to get vehicle counts by name
// const getVehicleCountByName = (vehicleName: string): number => {
//   const vehicle = Object.values(vehicleCounts).find(
//     v => v.name === vehicleName
//   );
//   return vehicle ? vehicle.count : 0;
// };

// const handlePaymentResponse = (response: string) => {
//   setPaymentResponse(response);
//   console.log('Payment response:', response);
  
//   try {
//     const responseObj = JSON.parse(response);
//     if (responseObj.messages?.resultCode === 'Ok') {
//       // Payment successful
//       console.log('Payment completed successfully!');
      
//       // Extract transaction details
//       const transId = responseObj.transactionResponse?.transId;
//       const authCode = responseObj.transactionResponse?.authCode;
      
//       // You can update the reservation with payment info here
//       alert('Payment successful! Your booking has been confirmed.');
      
//       // Optionally redirect to success page
//       // window.location.href = `/booking/success?transaction=${transId}`;
      
//     } else if (responseObj.messages?.resultCode === 'Error') {
//       // Payment failed
//       const errorMessages = responseObj.messages.message || [];
//       const errorText = errorMessages.map((msg: any) => msg.text).join(', ');
//       console.error('Payment failed:', errorText);
//       alert(`Payment failed: ${errorText}`);
//     }
//   } catch (e) {
//     // Response is not JSON, but we'll still show it
//     console.log('Payment response (non-JSON):', response);
//     alert('Payment processed. Please check your email for confirmation.');
//   }
// };

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
    <div className="font-extrabold dark:text-white sm:text-center flex flex-col justify-center w-fit items-center h-fit">
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
        formToken={formToken}
        viewMode={viewMode}
        initialData={initialData}
        activeVehicleCategory={activeVehicleCategory}
        setActiveVehicleCategory={setActiveVehicleCategory}
        // onGeneratePayment={generateFormToken}
        showPayment={showPayment}
      />

      Payment Section
{showPayment && formToken ? (
  <div className="w-full max-w-4xl mt-8 p-6 border rounded-lg shadow-lg bg-white">
    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Complete Your Payment</h2>
    
    {/* Payment Response Display */}
    {paymentResponse && (
      <div className="mb-4 p-4 bg-gray-100 rounded border">
        <h3 className="font-semibold mb-2">Payment Status:</h3>
        <div className="whitespace-pre-wrap text-sm">
          {paymentResponse.includes('"resultCode":"Ok"') ? (
            <div className="text-green-600 font-bold">
              ✅ Payment Successful! Your booking is confirmed.
            </div>
          ) : paymentResponse.includes('Error') ? (
            <div className="text-red-600 font-bold">
              ❌ Payment Failed. Please try again.
            </div>
          ) : (
            <pre>{paymentResponse}</pre>
          )}
        </div>
      </div>
    )}

    {/* Payment Iframe Container */}
    {/* <div className="border rounded-lg p-4 bg-gray-50">
      <BookingPay 
        formToken={formToken}
        setResponse={handlePaymentResponse}
      />
    </div> */}

    <div className="mt-6 text-center text-sm text-gray-600">
      <p>Having trouble with the payment form? Contact us at (702) 123-4567</p>
    </div>
  </div>
) : (
  // Show payment button in the main form area if not showing payment iframe
  !viewMode && totalPrice > 0 && selectedTimeValue && (
    <div className="mt-6 w-full max-w-4xl">
      <button
        type="button"
        // onClick={generateFormToken}
        disabled={isGeneratingToken}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
      >
        {isGeneratingToken ? 'Processing Payment...' : 'Proceed to Secure Payment'}
      </button>
    </div>
  )
)}
    </div>
  );
}