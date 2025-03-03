'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter } from 'next/navigation';
import { SignOut } from '@/utils/auth-helpers/server';
import Link from 'next/link';
import { ImNewTab } from 'react-icons/im';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import { handleRequest } from '@/utils/auth-helpers/client';
import ThemeButton from '@/components/ui/mode-toggle';
import { PowerCircleIcon, Unplug } from 'lucide-react';
import ClockinButton from '@/components/ui/AccountForms/clockin-dialogs/clockin-button';

export function UserNav({
  email,
  userInitials,
  userImage,
  userName,
  status,
  user_id,
  clockInTimeStamp,
  user_level
}: {
  email: string | undefined;
  userInitials: string;
  userImage: string;
  userName: string;
  status?: string | null | undefined;
  user_id: string;
  clockInTimeStamp?: string;
  user_level?: number;
}) {
  const router = getRedirectMethod() === 'client' ? useRouter() : null;
  const path = usePathname();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={userImage} alt={userName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email || 'no email'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuItem>
          {userName} (admin) <ThemeButton />
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/account"
            className="cursor-pointer dark:text-yellow-500 text-black flex items-center"
          >
            Profile <ImNewTab />
          </Link>
        </DropdownMenuItem>
        {status && (
          <div className="m-5">
            <ClockinButton
              clockInTimeStamp={clockInTimeStamp}
              status={status}
              user_id={user_id}
              user_level={user_level}
            />
          </div>
          // <DropdownMenuItem asChild>
          // </DropdownMenuItem>
        )}

        <form
          className="flex justify-end"
          onSubmit={(e) => handleRequest(e, SignOut, router)}
        >
          <input type="hidden" name="pathName" value={path} />
          <Button
            type="submit"
            variant={'ghost'}
            className="text-red-600 flex gap-1 items-center flex-row-reverse"
          >
            <PowerCircleIcon /> Log Out
          </Button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
