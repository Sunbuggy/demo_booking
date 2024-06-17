import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="mx-auto px-6 bg-zinc-900 w-screen">
      <div className="grid grid-cols-1 gap-2 py-12 text-white transition-colors duration-150 border-b lg:grid-cols-12 border-zinc-600 bg-zinc-900">
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
              className="w-[100px] h-[30px] md:w-[120px] md:h-[36px]"
            />{' '}
            <span>Sunbuggy</span>
          </Link>
        </div>
        <div className="col-span-1 lg:col-span-2">
          <ul className="flex flex-col flex-initial md:flex-1">
            <li className="py-3 md:py-0 md:pb-4">
              <Link
                href="/"
                className="text-white transition duration-150 ease-in-out hover:text-zinc-200"
              >
                Home
              </Link>
            </li>
            <li className="py-3 md:py-0 md:pb-4">
              <Link
                href="/"
                className="text-white transition duration-150 ease-in-out hover:text-zinc-200"
              >
                About
              </Link>
            </li>
            <li className="py-3 md:py-0 md:pb-4">
              <Link
                href="/"
                className="text-white transition duration-150 ease-in-out hover:text-zinc-200"
              >
                Careers
              </Link>
            </li>
            <li className="py-3 md:py-0 md:pb-4">
              <Link
                href="/"
                className="text-white transition duration-150 ease-in-out hover:text-zinc-200"
              >
                Blog
              </Link>
            </li>
          </ul>
        </div>
        <div className="col-span-1 lg:col-span-2">
          <ul className="flex flex-col flex-initial md:flex-1">
            <li className="py-3 md:py-0 md:pb-4">
              <p className="font-bold text-white transition duration-150 ease-in-out hover:text-zinc-200">
                LEGAL
              </p>
            </li>
            <li className="py-3 md:py-0 md:pb-4">
              <Link
                href="/"
                className="text-white transition duration-150 ease-in-out hover:text-zinc-200"
              >
                Privacy Policy
              </Link>
            </li>
            <li className="py-3 md:py-0 md:pb-4">
              <Link
                href="/"
                className="text-white transition duration-150 ease-in-out hover:text-zinc-200"
              >
                Terms of Use
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col items-center justify-between py-12 space-y-4 md:flex-row bg-zinc-900">
        <div>
          <span>
            &copy; {new Date().getFullYear()} Sunbuggy, Inc. All rights
            reserved.
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-white mr-3">Crafted by</span>
          <a href="https://sunbuggy.com" aria-label="sunbuggy.com Link">
            <Image
              src={'/sb-logo-yellow-with-text.svg'}
              alt="sunbuggy logo"
              width="0"
              height="0"
              sizes="100vw"
              className="w-[100px] h-[30px] md:w-[120px] md:h-[36px]"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
