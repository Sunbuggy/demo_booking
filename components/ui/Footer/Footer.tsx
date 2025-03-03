import Link from 'next/link';
import Image from 'next/image';
import { getUserDetails } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';

export default async function Footer() {
  const date = new Date().toLocaleDateString('en-CA'); // 'en-CA' format is 'YYYY-MM-DD'
  const supabase = createClient();
  const user = await getUserDetails(supabase);
  if (!user) return null;
  const role = user[0]?.user_level;
  return (
    <footer className="mx-auto px-6  w-screen bg-black/75">
      <div className="grid grid-cols-1 gap-2 py-12 transition-colors duration-150 border-b lg:grid-cols-12 border-zinc-600 ">
        <div className="col-span-1 lg:col-span-2">
          <Link
            href="/"
            className="flex items-center flex-initial font-bold md:mr-24"
          >
            <Image
              src={'/sb-logo-circle-yellow.svg'}
              alt="sunbuggy logo"
              width="0"
              height="0"
              sizes="100vw"
              className="w-[100px] h-[30px] md:w-[120px] md:h-[36px] hidden dark:block"
            />{' '}
            <Image
              src={'/sb-logo-circle-black.svg'}
              alt="sunbuggy logo"
              width="0"
              height="0"
              sizes="100vw"
              className="w-[100px] h-[30px] md:w-[120px] md:h-[36px] dark:hidden"
            />{' '}
            <span>Sunbuggy</span>
          </Link>
        </div>
        <div className="col-span-1 lg:col-span-2">
          <ul className="flex flex-col flex-initial md:flex-1">
            <li className="py-3 md:py-0 md:pb-4">
              <Link href="/" className=" transition duration-150 ease-in-out ">
                Home
              </Link>
            </li>
            <li className="py-3 md:py-0 md:pb-4">
              <Link href="/" className=" transition duration-150 ease-in-out ">
                About
              </Link>
            </li>
            <li className="py-3 md:py-0 md:pb-4">
              <Link href="/" className=" transition duration-150 ease-in-out ">
                Careers
              </Link>
            </li>
            <li className="py-3 md:py-0 md:pb-4">
              <Link href="/" className=" transition duration-150 ease-in-out ">
                Blog
              </Link>
            </li>
          </ul>
        </div>
        <div className="col-span-1 lg:col-span-2">
          <ul className="flex flex-col flex-initial md:flex-1">
            <li className="py-3 md:py-0 md:pb-4">
              <p className="font-bold  transition duration-150 ease-in-out ">
                LEGAL
              </p>
            </li>
            <li className="py-3 md:py-0 md:pb-4">
              <Link href="/" className=" transition duration-150 ease-in-out ">
                Privacy Policy
              </Link>
            </li>
            <li className="py-3 md:py-0 md:pb-4">
              <Link href="/" className=" transition duration-150 ease-in-out ">
                Terms of Use
              </Link>
            </li>
            {role && role > 299 && (
              <li className="py-3 md:py-0 md:pb-4">
                <Link
                  href={`/biz/${date}`}
                  className=" transition duration-150 ease-in-out "
                >
                  Internal{' '}
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="flex flex-col items-center justify-between py-12 space-y-4 md:flex-row ">
        <div>
          <span>
            &copy; {new Date().getFullYear()} Sunbuggy, Inc. All rights
            reserved.
          </span>
        </div>
        <div className="flex items-center">
          <span className=" mr-3">Crafted by</span>
          <a href="https://sunbuggy.com" aria-label="sunbuggy.com Link">
            <div className=" hidden dark:block">
              <Image
                src={'/sb-logo-yellow-with-text.svg'}
                alt="sunbuggy logo"
                width="0"
                height="0"
                sizes="100vw"
                className="w-[100px] h-[30px] md:w-[120px] md:h-[36px]"
              />
            </div>
            <div className="dark:hidden">
              <Image
                src={'/sb-logo-black-with-text.svg'}
                alt="sunbuggy logo"
                width="0"
                height="0"
                sizes="100vw"
                className="w-[100px] h-[30px] md:w-[120px] md:h-[36px]"
              />
            </div>
          </a>
        </div>
      </div>
    </footer>
  );
}
