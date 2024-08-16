
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getUserDetails } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';

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
    <div className="">
      <ul>
        {role && role > 299 && (
            <div>
          <li className="">
            <Link
              href={`/biz/${date}`}
              className="transition duration-150 ease-in-out"
            >
              Internal
            </Link>
          </li>
                 <li className="nav-item">
          <Link href="https://www.sunbuggy.biz/login.php" className="nav-link">
            Old Biz
          </Link>
        </li> 
        </div>
        )}
        <li className="nav-item">
          <Link href="/" className="nav-link">
            Home
          </Link>
        </li>
</ul>
    </div>
  );
}
