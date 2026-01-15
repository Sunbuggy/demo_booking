'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MessageSquare, User, Smartphone } from 'lucide-react';
import Link from 'next/link';

interface ContactUser {
  full_name: string;
  email?: string | null;
  phone?: string | null;
}

export default function ContactMenu({ user, iconOnly = false }: { user: ContactUser, iconOnly?: boolean }) {
  // If no contact info, show nothing or disabled? 
  // Let's hide it to keep UI clean, or show generic if you prefer.
  if (!user.email && !user.phone) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {iconOnly ? (
            <button className="text-muted-foreground hover:text-primary transition-colors p-1">
                <MessageSquare className="w-4 h-4" />
            </button>
        ) : (
            <Button variant="ghost" size="sm" className="h-8 gap-2">
                <MessageSquare className="w-4 h-4" /> Contact
            </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-xs sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-muted-foreground" />
            Contact {user.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 py-2">
            {/* PHONE ACTIONS */}
            {user.phone ? (
                <>
                    <Button asChild variant="outline" className="w-full justify-start h-12 text-base">
                        <Link href={`tel:${user.phone}`}>
                            <Phone className="w-5 h-5 mr-3 text-green-600" />
                            Call <span className="text-xs text-muted-foreground ml-auto">{user.phone}</span>
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start h-12 text-base">
                        <Link href={`sms:${user.phone}`}>
                            <Smartphone className="w-5 h-5 mr-3 text-blue-600" />
                            Text <span className="text-xs text-muted-foreground ml-auto">{user.phone}</span>
                        </Link>
                    </Button>
                </>
            ) : (
                <div className="text-sm text-muted-foreground italic text-center py-1">No phone number on file.</div>
            )}

            <div className="h-px bg-border my-1" />

            {/* EMAIL ACTIONS */}
            {user.email ? (
                <Button asChild variant="outline" className="w-full justify-start h-12 text-base">
                    <Link href={`mailto:${user.email}`}>
                        <Mail className="w-5 h-5 mr-3 text-orange-600" />
                        Email <span className="text-xs text-muted-foreground ml-auto truncate max-w-[150px]">{user.email}</span>
                    </Link>
                </Button>
            ) : (
                <div className="text-sm text-muted-foreground italic text-center py-1">No email on file.</div>
            )}
        </div>

      </DialogContent>
    </Dialog>
  );
}