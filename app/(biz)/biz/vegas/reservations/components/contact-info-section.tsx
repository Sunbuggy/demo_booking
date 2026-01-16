'use client';

import { Contact, Mail, Phone, User, CheckCircle2 } from 'lucide-react';
import { ContactFom } from './server-booking';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { checkOrCreateUserSilent } from '@/app/actions/user-check';

// Semantic Theme Classes
const SECTION_CARD_CLASS = "p-5 bg-card text-card-foreground border border-border rounded-xl shadow-sm";
const INPUT_CLASS = "w-full h-10 px-3 pl-10 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";
const LABEL_CLASS = "block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5";
const HEADER_CLASS = "text-lg font-bold text-foreground mb-4 flex items-center gap-2";

interface ContactInfoSectionProps {
  contactForm: ContactFom;
  setContactForm: Dispatch<SetStateAction<ContactFom>>;
  viewMode: boolean;
}

export function ContactInfoSection({
  contactForm,
  setContactForm,
  viewMode
}: ContactInfoSectionProps) {
  const [userStatus, setUserStatus] = useState<'idle' | 'checking' | 'verified'>('idle');

  const handleChange = (field: keyof ContactFom, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
    // Reset verification status if they change email
    if (field === 'email') setUserStatus('idle'); 
  };

  // SILENT BACKGROUND CHECK
  useEffect(() => {
    const checkUser = async () => {
      if (
        !viewMode && 
        contactForm.email.includes('@') && 
        contactForm.email.includes('.') &&
        contactForm.name.length > 2 &&
        contactForm.phone.length > 6 &&
        userStatus === 'idle'
      ) {
        setUserStatus('checking');
        
        const timer = setTimeout(async () => {
          const result = await checkOrCreateUserSilent(
            contactForm.email, 
            contactForm.name, 
            contactForm.phone
          );
          
          if (result.userId) {
            setUserStatus('verified');
            console.log('User verified/created silently:', result.userId);
          } else {
            setUserStatus('idle');
          }
        }, 1500);

        return () => clearTimeout(timer);
      }
    };

    checkUser();
  }, [contactForm.email, contactForm.name, contactForm.phone, userStatus, viewMode]);

  return (
    <div className={SECTION_CARD_CLASS}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={HEADER_CLASS.replace('mb-4', 'mb-0')}>
          <Contact className="w-5 h-5 text-primary" />
          Contact Information
        </h2>
        {userStatus === 'verified' && (
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium animate-in fade-in">
            <CheckCircle2 className="w-3 h-3" />
            <span>Profile Ready</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className={LABEL_CLASS}>Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="full_name"
              value={contactForm.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={INPUT_CLASS}
              placeholder="Driver / Primary Contact"
              disabled={viewMode}
              autoComplete="name"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className={LABEL_CLASS}>Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              name="email"
              value={contactForm.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={INPUT_CLASS}
              placeholder="receipts@example.com"
              disabled={viewMode}
              autoComplete="email"
              onBlur={() => {
                 if (contactForm.email && userStatus === 'idle') setUserStatus('idle');
              }}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className={LABEL_CLASS}>Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="tel"
              name="phone"
              value={contactForm.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={INPUT_CLASS}
              placeholder="(555) 123-4567"
              disabled={viewMode}
              autoComplete="tel"
            />
          </div>
        </div>
      </div>
    </div>
  );
}