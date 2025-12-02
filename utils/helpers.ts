export const getURL = (path: string = '') => {
  let url = '';

  // Check if we are in production and NEXT_PUBLIC_SITE_URL is set
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_SITE_URL
  ) {
    url = process.env.NEXT_PUBLIC_SITE_URL.trim();
  }
  // If not in production or NEXT_PUBLIC_SITE_URL is not set, fallback to localhost or Vercel URL
  else {
    url =
      process?.env?.NEXT_PUBLIC_VERCEL_URL &&
      process.env.NEXT_PUBLIC_VERCEL_URL.trim() !== ''
        ? process.env.NEXT_PUBLIC_VERCEL_URL
        : 'http://localhost:3000';
  }

  // Trim the URL and remove trailing slash if exists
  url = url.replace(/\/+$/, '');
  // Make sure to include `https://` when not localhost
  url = url.includes('http') ? url : `https://${url}`;
  // Ensure path starts without a slash to avoid double slashes in the final URL
  path = path.replace(/^\/+/, '');

  // Concatenate the URL and the path
  return path ? `${url}/${path}` : url;
};

export const toDateTime = (secs: number) => {
  var t = new Date(+0); // Unix epoch start.
  t.setSeconds(secs);
  return t;
};

export const calculateTrialEndUnixTimestamp = (
  trialPeriodDays: number | null | undefined
) => {
  // Check if trialPeriodDays is null, undefined, or less than 2 days
  if (
    trialPeriodDays === null ||
    trialPeriodDays === undefined ||
    trialPeriodDays < 2
  ) {
    return undefined;
  }

  const currentDate = new Date(); // Current date and time
  const trialEnd = new Date(
    currentDate.getTime() + (trialPeriodDays + 1) * 24 * 60 * 60 * 1000
  ); // Add trial days
  return Math.floor(trialEnd.getTime() / 1000); // Convert to Unix timestamp in seconds
};

const toastKeyMap: { [key: string]: string[] } = {
  status: ['status', 'status_description'],
  error: ['error', 'error_description']
};

const getToastRedirect = (
  path: string,
  toastType: string,
  toastName: string,
  toastDescription: string = '',
  disableButton: boolean = false,
  arbitraryParams: string = ''
): string => {
  const [nameKey, descriptionKey] = toastKeyMap[toastType];

  let redirectPath = `${path}?${nameKey}=${encodeURIComponent(toastName)}`;

  if (toastDescription) {
    redirectPath += `&${descriptionKey}=${encodeURIComponent(toastDescription)}`;
  }

  if (disableButton) {
    redirectPath += `&disable_button=true`;
  }

  if (arbitraryParams) {
    redirectPath += `&${arbitraryParams}`;
  }

  return redirectPath;
};

export const getStatusRedirect = (
  path: string,
  statusName: string,
  statusDescription: string = '',
  disableButton: boolean = false,
  arbitraryParams: string = ''
) =>
  getToastRedirect(
    path,
    'status',
    statusName,
    statusDescription,
    disableButton,
    arbitraryParams
  );

export const getErrorRedirect = (
  path: string,
  errorName: string,
  errorDescription: string = '',
  disableButton: boolean = false,
  arbitraryParams: string = ''
) =>
  getToastRedirect(
    path,
    'error',
    errorName,
    errorDescription,
    disableButton,
    arbitraryParams
  );

export const mb30_open_times = ['9 am (20% discount)', '11 am', '1 pm'];
export const mb60_open_times = [ '8 am (20% discount)','10 am', '12 pm', '2 pm'];
export const ffr_open_times = ['8 am (20% discount)', '10 am', '12 pm', '2 pm'];
export const mb120_open_times = ['8 am ', '10 am'];
export const vof_open_times = ['8 am'];
export const atv30_open_times = ['8 am', '10 am', '12 pm'];
export const atv60_open_times = ['8 am', '10 am', '12 pm'];
export const ama_open_times = ['8 am'];

export type MbjVehicle = {
  id: number;
  name: string;
  vehicle_id: number;
  seats: number;
  pricing: {
    mb30?: number;
    mb60?: number;
    mb120?: number;
  };
};

export const mbj_vehicles_list = [
  {
    id: 1,
    name: '1 seat desert racer',
    vehicle_id: 1,
    seats: 1,
    pricing: {
      mb30: 199,
      mb60: 299,
      mb120: 699
    }
  },
  {
    id: 2,
    name: '2 seat desert racer',
    vehicle_id: 1,
    seats: 2,
    pricing: {
      mb30: 299,
      mb60: 399,
      mb120: 899
    }
  },
  {
    id: 3,
    name: '4 seat desert racer',
    vehicle_id: 1,
    seats: 4,
    pricing: {
      mb30: 399,
      mb60: 499,
      mb120: 999
    }
  },
  {
    id: 4,
    name: '6 seat desert racer',
    vehicle_id: 1,
    seats: 6,
    pricing: {
      mb30: 599,
      mb60: 699
    }
  },
  {
    id: 5,
    name: 'Ride with Guide',
    vehicle_id: 1,
    seats: 1,
    pricing: {
      mb30: 149,
      mb60: 249,
      mb120: 449
    }
  }
];

export const ffr_vehicles_list = [
  {
    id: 1,
    name: '2 seat desert racer',
    vehicle_id: 1,
    seats: 2,
    pricing: {
      desert_racer: 399
    }
  },
  {
    id: 2,
    name: '4 seat desert racer',
    vehicle_id: 1,
    seats: 4,
    pricing: {
      desert_racer: 499
    }
  },
  {
    id: 3,
    name: '6 seat desert racer',
    vehicle_id: 1,
    seats: 6,
    pricing: {
      desert_racer: 699
    }
  }
];

export const vof_vehicles_list = [
  {
    id: 1,
    vehicle_id: 1,
    name: '2 seat desert racer',
    seats: 2,
    pricing: {
      price: 799,
      name: 'desert_racer'
    }
  },
  {
    id: 2,
    vehicle_id: 1,
    name: '4 seat desert racer',
    seats: 4,
    pricing: {
      price: 999,
      name: 'desert_racer'
    }
  },
  {
    id: 3,
    vehicle_id: 1,
    name: '6 seat desert racer',
    seats: 6,
    pricing: {
      price: 1299,
      name: 'desert_racer'
    }
  },
  {
    id: 4,
    vehicle_id: 1,
    name: 'Ride with Guide',
    seats: 1,
    pricing: {
      price: 349,
      name: 'ride_with_guide'
    }
  },
  {
    id: 5,
    vehicle_id: 2,
    name: '1 Seat full ATV',
    seats: 1,
    pricing: {
      price: 399,
      name: 'full_atv'
    }
  },
  {
    id: 6,
    vehicle_id: 4,
    name: '2 seat UTV',
    seats: 2,
    pricing: {
      price: 799,
      name: 'utv'
    }
  }
];

export const atv_vehicles_list = [
  // Full ATV vehicles
  {
    id: 1,
    name: 'Full size ATV',
    vehicle_id: 1,
    seats: 1,
    pricing: {
      full_atv_30: 133,
      full_atv_60: 209
    }
  },

  // Medium ATV vehicles
  {
    id: 2,
    name: 'Medium size ATV',
    vehicle_id: 2,
    seats: 1,
    pricing: {
      medium_atv_30: 107,
      medium_atv_60: 159
    }
  },

];

export const ama_vehicles_list = [
  {
    id: 1,
    name: 'Full size ATV',
    vehicle_id: 5,
    seats: 1,
    pricing: {
      full_atv: 499,
    }
  },
    {
    id: 2,
    name: '1 seat desert racer',
    vehicle_id: 1,
    seats: 1,
    pricing: {
      price: 699,
    }
  },
  {
    id: 3,
    name: '2 seat desert racer',
    vehicle_id: 1,
    seats: 2,
    pricing: {
      price: 999,
    }
  },
  {
    id: 4,
    name: '4 seat desert racer',
    vehicle_id: 1,
    seats: 4,
    pricing: {
      price: 1199,
    }
  },
  {
    id: 5,
    name: '6 seat desert racer',
    vehicle_id: 1,
    seats: 6,
    pricing: {
      price: 1399,
    }
  },
  {
    id: 6,
    vehicle_id: 7,
    name: '2 seat UTV',
    seats: 2,
    pricing: {
      price: 999,
      name: '2 seat UTV'
    }
  },
    {
    id: 7,
    vehicle_id: 8,
    name: '4 seat UTV',
    seats: 4,
    pricing: {
      price: 1199,
      name: '4 seat UTV'
    }
  }

]



const vehicles = [
  {
    id: 1,
    name: 'Desert Racer',
    description:
      'The Desert Racer is a high performance off-road vehicle that is designed to take on the toughest terrain. It is equipped with a powerful engine and a rugged suspension system that can handle the most challenging conditions. The Desert Racer is perfect for those who want to experience the thrill of off-road racing in a safe and controlled environment.',
    type: 'Dune Buggy'
  },
  {
    id: 2,
    name: 'Full ATV',
    description:
      'The ATV is a versatile off-road vehicle that is perfect for exploring the desert. It is equipped with a powerful engine and rugged tires that can handle the toughest terrain. The ATV is perfect for those who want to experience the thrill of off-road riding in a safe and controlled environment.',
    type: 'ATV'
  },

  {
    id: 4,
    name: 'UTV',
    description:
      'The UTV is a versatile off-road vehicle that is perfect for exploring the desert. It is equipped with a powerful engine and rugged tires that can handle the toughest terrain. The UTV is perfect for those who want to experience the thrill of off-road riding in a safe and controlled environment.',
    type: 'UTV'
  }
];

export const minibajachase = {
  description: `By far our most popular Off-Road Adventure Tour in the Las Vegas area is the Vegas Mini Baja Chase. The Mini Baja Chase is fast-paced and not tailored for the weak at heart. This is the Las Vegas Driving Experience you've likely seen on TV as the Vegas Mini Baja Chase has been featured by several different TV networks from around the world. The heart-pounding chase was billed as "Sin City's Best Near Death Experience!" by Rolling Stone Magazine. THIS IS NOT A SLOW PACED OFF ROAD SIGHTSEEING TOUR (if you'd like slow and pretty we can take you to the Valley Of Fire instead) Your job will be to chase one of our expert Dunies. The only thing that will slow our Dunie down is if he's waiting for you to catch up. `,
  title: 'Mini Baja Chase',
  videoId: '0FfWkSqIXFU',
  playlistId: 'PLrCmFi7dP5HxPsdsQxLj2bprh5jz7zASD'
};

export const familyFunRomp = {
  description: `A special package for those wishing to take the kids Off-Road on a buggy ride but not get thrown in the mix of wild and crazy patrons who may be here for a bachelor party, corporate outing, or other Off-Road groups.... It's family fun adventure time in Las Vegas, you brought the kids to the few family friendly Las Vegas attractions on the strip, and they've already run you through every rollercoaster in Las Vegas.  When you are Adventure Dome'd and Stratosphere'd out, or you'd just rather not do yet another passive amusement park ride, it's time for Off-Road fun at Sun Buggy.`,
  title: 'Family Fun Romp',
  videoId: 'YhTLMoIVG8U',
  playlistId: 'PLrCmFi7dP5HyBnGFueAZOlPDQEF569Xf3'
};

export const valleyOfFire = {
  description: `We at SunBuggy take great pride in being the only approved operation in Valley of Fire permitted to run Dune Buggy, UTV, and ATV / Quad Bike tours with Tread Lightly certified Expert Guides. This is truly a Executive level Off Road experience.  `,
  title: 'Valley of Fire',
  videoId: 'nwzufdhTZWw',
  playlistId: 'PLrCmFi7dP5HwAWXYtkEUD09d6744ugRh0'
};

export const lasvegas_atv_tours = {
  description: ` This is a Guided ATV tour into Nevada's oldest state park, the Valley Of Fire. That's right, SunBuggy is permitted by both the State Parks Department as well as the federal government to run tours in this Pristine area (not near the Valley of Fire, or in view of The Valley Of Fire, but actually right into and through this tread lightly area!)  This isn't a timed adventure, and there's no hurry. It's done at your leisure.`,
  title: 'Las Vegas Premium ATV Tours',
  src: '/atv-image.jpg'
};

export const amargosa = {
  description: `You'll have 4 hours to EXPLORE the BIG SAND DUNES with SunBuggy Support staff on hand to show you around this sandy playground, ensuring that you have a great time and know where environmentally sensitive no-go areas are `,
  title: 'Amargosa',
  videoId: 'nwzufdhTZWw',
  playlistId: 'PLrCmFi7dP5HwAWXYtkEUD09d6744ugRh0'
};

