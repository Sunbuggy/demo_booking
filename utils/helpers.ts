import type { Tables } from '@/types_db';

type Price = Tables<'prices'>;

export const getURL = (path: string = '') => {
  // Check if NEXT_PUBLIC_SITE_URL is set and non-empty. Set this to your site URL in production env.
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL &&
    process.env.NEXT_PUBLIC_SITE_URL.trim() !== ''
      ? process.env.NEXT_PUBLIC_SITE_URL
      : // If not set, check for NEXT_PUBLIC_VERCEL_URL, which is automatically set by Vercel.
        process?.env?.NEXT_PUBLIC_VERCEL_URL &&
          process.env.NEXT_PUBLIC_VERCEL_URL.trim() !== ''
        ? process.env.NEXT_PUBLIC_VERCEL_URL
        : // If neither is set, default to localhost for local development.
          'http://localhost:3000/';

  // Trim the URL and remove trailing slash if exists.
  url = url.replace(/\/+$/, '');
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  // Ensure path starts without a slash to avoid double slashes in the final URL.
  path = path.replace(/^\/+/, '');

  // Concatenate the URL and the path.
  return path ? `${url}/${path}` : url;
};

export const postData = async ({
  url,
  data
}: {
  url: string;
  data?: { price: Price };
}) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    credentials: 'same-origin',
    body: JSON.stringify(data)
  });

  return res.json();
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
export const timeArray = [
  '7:00 am',
  '8:00 am',
  '9:00 am',
  '10:00 am',
  '11:00 am',
  '12:00 pm',
  '1:00 pm',
  '2:00 pm',
  '3:00 pm',
  '4:00 pm',
  '5:00 pm',
  '6:00 pm',
  '7:00 pm',
  '8:00 pm',
  '9:00 pm'
];

export const mb30_open_times = ['9 am', '11 am', '1 pm'];
export const mb60_open_times = ['8 am', '10 am', '12 pm', '2 pm'];
export const mb120_open_times = ['8 am', '10 am'];
const pricing = {
  '8 am': {
    mb30: 129,
    mb60: 199,
    mb120: 299
  },
  '9 am': {
    mb30: 149,
    mb60: 229,
    mb120: 349
  }
};

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
