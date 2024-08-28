'use client'
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

export function UserNav({
  email,
  userInitials,
  userImage,
  userName
}: {
  email: string | undefined;
  userInitials: string;
  userImage: string;
  userName: string;
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
          {userName} (admin) <ThemeButton/>
        </DropdownMenuItem>
        <DropdownMenuItem>
        <Link
              target="_blank"
              href="/account"
              className="cursor-pointer dark:text-yellow-500 text-black flex items-center"
            >
              Profile <ImNewTab />
            </Link>        
            </DropdownMenuItem>
            <DropdownMenuItem>
            <form onSubmit={(e) => handleRequest(e, SignOut, router)}>
              <input type="hidden" name="pathName" value={path} />
              <button
                type="submit"
                className="inline-flex items-center leading-6 font-medium transition ease-in-out duration-75 cursor-pointer dark:text-yellow-500 text-black rounded-md p-1 h-[36px]"
              >
                Sign out
              </button>
            </form>        
            </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
