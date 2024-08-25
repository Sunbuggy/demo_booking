import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserDetails } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import { SheetClose } from '../sheet';

export default function NavSideBar() {
  const [role, setRole] = useState<number | null>(null);
  const date = new Date().toLocaleDateString('en-CA'); // 'en-CA' format is 'YYYY-MM-DD'

  useEffect(() => {
    async function fetchUserDetails() {
      const supabase = createClient();
      const user = await getUserDetails(supabase);
      if (user && user[0]) {
        setRole(user[0].user_level);
      }
    }
    fetchUserDetails();
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <SheetClose asChild>
        <Link
          target="_blank"
          href="/"
          className=" border-2 p-2 rounded-md white_button transition duration-150 ease-in-out"
        >
          Home
        </Link>
      </SheetClose>
      {role && role > 299 && (
        <div className="flex flex-col gap-3">
          <SheetClose asChild>
            <Link
              target="_blank"
              className=" border-2 p-2 rounded-md white_button transition duration-150 ease-in-out"
              href={`/biz/${date}`}
            >
              Internal
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link
              target="_blank"
              href="https://www.sunbuggy.biz/login.php"
              className=" border-2 p-2 rounded-md white_button transition duration-150 ease-in-out"
            >
              Old Biz
            </Link>
          </SheetClose>
        </div>
      )}
      {role && role > 899 && (
        <div className="flex flex-col gap-3">
          <SheetClose asChild>
            <Link
              target="_blank"
              href={`/biz/users/admin`}
              className=" border-2 p-2 rounded-md white_button transition duration-150 ease-in-out"
            >
              Admin
            </Link>
          </SheetClose>
        </div>
      )}
    </div>
  );
}
